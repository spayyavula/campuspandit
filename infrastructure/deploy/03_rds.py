"""03_rds.py — Secrets Manager secret + RDS Multi-AZ + security group."""
import json
import logging
import os
import secrets
import string
import time

import click

from shared.config import SESSION, REGION, ACCOUNT_ID, TAGS, RDS_INSTANCE_ID, RDS_SECRET_NAME
from shared.idempotent import get_or_create, safe_delete
from shared.waits import wait_for_rds_available
from shared import state

logger = logging.getLogger(__name__)

rds = SESSION.client("rds")
sm = SESSION.client("secretsmanager")
ec2 = SESSION.client("ec2")

SG_NAME = "campuspandit-rds-sg"


def _default_vpc_id() -> str:
    resp = ec2.describe_vpcs(Filters=[{"Name": "isDefault", "Values": ["true"]}])
    return resp["Vpcs"][0]["VpcId"]


def _get_sg_id(name: str) -> str | None:
    resp = ec2.describe_security_groups(
        Filters=[{"Name": "group-name", "Values": [name]}]
    )
    sgs = resp["SecurityGroups"]
    return sgs[0]["GroupId"] if sgs else None


def _generate_password(length: int = 32) -> str:
    alphabet = string.ascii_letters + string.digits + "!#$%&*+,-.:;<=>?[]^_`{|}~"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def up() -> None:
    """Provision Secrets Manager secret + RDS instance. Idempotent."""
    # --- Secrets Manager ---
    # B1 fix: password must flow from the secret into create_db_instance directly.
    # ManageMasterUserPassword=True is mutually exclusive with MasterUserPassword.
    secret_arn: str
    password: str
    try:
        existing = sm.describe_secret(SecretId=RDS_SECRET_NAME)
        secret_arn = existing["ARN"]
        logger.info("Secret already exists: %s — reading password for RDS call.", secret_arn)
        secret_data = json.loads(
            sm.get_secret_value(SecretId=RDS_SECRET_NAME)["SecretString"]
        )
        password = secret_data["password"]
    except sm.exceptions.ResourceNotFoundException:
        password = _generate_password()
        secret_value = json.dumps({
            "username": "campuspandit_admin",
            "password": password,
            "engine": "postgres",
            "host": "PENDING",  # updated after RDS is available
            "port": 5432,
            "dbname": "campuspandit",
        })
        resp = sm.create_secret(
            Name=RDS_SECRET_NAME,
            SecretString=secret_value,
            Tags=TAGS,
        )
        secret_arn = resp["ARN"]
        logger.info("Created secret: %s", secret_arn)

    state.set("/campuspandit/deploy/rds/secret_arn", secret_arn)

    # --- Security group for RDS ---
    vpc_id = _default_vpc_id()
    rds_sg_id = _get_sg_id(SG_NAME)
    if not rds_sg_id:
        resp = ec2.create_security_group(
            GroupName=SG_NAME,
            Description="CampusPandit RDS — allows port 5432 from proxy-sg only",
            VpcId=vpc_id,
            TagSpecifications=[{
                "ResourceType": "security-group",
                "Tags": TAGS,
            }],
        )
        rds_sg_id = resp["GroupId"]
        logger.info("Created RDS security group: %s", rds_sg_id)
    else:
        logger.info("RDS security group already exists: %s", rds_sg_id)

    state.set("/campuspandit/deploy/rds/security_group_id", rds_sg_id)

    # --- RDS instance ---
    try:
        desc = rds.describe_db_instances(DBInstanceIdentifier=RDS_INSTANCE_ID)
        endpoint = desc["DBInstances"][0]["Endpoint"]["Address"]
        logger.info("RDS instance already exists — endpoint: %s", endpoint)
    except rds.exceptions.DBInstanceNotFoundFault:
        logger.info("Creating RDS instance %s ...", RDS_INSTANCE_ID)
        rds.create_db_instance(
            DBInstanceIdentifier=RDS_INSTANCE_ID,
            DBInstanceClass="db.t4g.small",
            Engine="postgres",
            EngineVersion="16",
            MultiAZ=True,
            AllocatedStorage=20,
            StorageType="gp3",
            StorageEncrypted=True,
            MasterUsername="campuspandit_admin",
            MasterUserPassword=password,  # B1: direct password; no ManageMasterUserPassword
            DBName="campuspandit",
            BackupRetentionPeriod=7,
            DeletionProtection=True,
            EnableIAMDatabaseAuthentication=True,
            PubliclyAccessible=True,  # TEMP — flip OFF in Phase 3 step 5
            VpcSecurityGroupIds=[rds_sg_id],
            Tags=TAGS,
        )
        wait_for_rds_available(RDS_INSTANCE_ID)
        desc = rds.describe_db_instances(DBInstanceIdentifier=RDS_INSTANCE_ID)
        endpoint = desc["DBInstances"][0]["Endpoint"]["Address"]
        logger.info("RDS instance created — endpoint: %s", endpoint)

        # Update secret with actual host
        current_secret = json.loads(
            sm.get_secret_value(SecretId=RDS_SECRET_NAME)["SecretString"]
        )
        current_secret["host"] = endpoint
        sm.put_secret_value(
            SecretId=RDS_SECRET_NAME,
            SecretString=json.dumps(current_secret),
        )
        logger.info("Secret updated with RDS endpoint.")

    state.set("/campuspandit/deploy/rds/endpoint", endpoint)
    logger.info("03_rds: up complete.")


def down() -> None:
    """Tear down RDS instance and secret. Idempotent."""
    force = os.environ.get("CAMPUSPANDIT_TEARDOWN_FORCE") == "1"  # B2

    # Disable deletion protection first (so the delete call works at all)
    try:
        rds.modify_db_instance(
            DBInstanceIdentifier=RDS_INSTANCE_ID,
            DeletionProtection=False,
            ApplyImmediately=True,
        )
        logger.info("Disabled deletion protection on %s", RDS_INSTANCE_ID)
    except rds.exceptions.DBInstanceNotFoundFault:
        pass

    # B2: honour --force flag for final snapshot decision
    delete_kwargs: dict = {
        "DBInstanceIdentifier": RDS_INSTANCE_ID,
        "DeleteAutomatedBackups": False,
    }
    if force:
        delete_kwargs["SkipFinalSnapshot"] = True
        logger.warning("--force: skipping final snapshot for %s", RDS_INSTANCE_ID)
    else:
        delete_kwargs["SkipFinalSnapshot"] = False
        delete_kwargs["FinalDBSnapshotIdentifier"] = (
            f"{RDS_INSTANCE_ID}-final-{int(time.time())}"
        )
        logger.info(
            "Final snapshot will be taken as %s",
            delete_kwargs["FinalDBSnapshotIdentifier"],
        )

    safe_delete(
        lambda: rds.delete_db_instance(**delete_kwargs),
        rds.exceptions.DBInstanceNotFoundFault,
    )
    logger.info("RDS instance delete initiated (or already absent).")

    # Delete secret (with 7-day recovery window)
    safe_delete(
        lambda: sm.delete_secret(
            SecretId=RDS_SECRET_NAME,
            RecoveryWindowInDays=7,
        ),
        sm.exceptions.ResourceNotFoundException,
    )
    logger.info("Secret scheduled for deletion (or already absent).")

    # Delete security group — B3: catch only InvalidGroup.NotFound, not broad ClientError
    sg_id = state.get("/campuspandit/deploy/rds/security_group_id")
    if sg_id:
        try:
            ec2.delete_security_group(GroupId=sg_id)
            logger.info("Deleted RDS security group %s", sg_id)
        except ec2.exceptions.ClientError as e:
            if e.response["Error"]["Code"] != "InvalidGroup.NotFound":
                raise
            logger.info("RDS security group %s already absent", sg_id)

    for param in [
        "/campuspandit/deploy/rds/endpoint",
        "/campuspandit/deploy/rds/secret_arn",
        "/campuspandit/deploy/rds/security_group_id",
    ]:
        state.delete(param)
    logger.info("03_rds: down complete.")


@click.command()
@click.argument("action", type=click.Choice(["up", "down"]))
def cli(action: str) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
    {"up": up, "down": down}[action]()


if __name__ == "__main__":
    cli()
