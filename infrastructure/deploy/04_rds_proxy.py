"""04_rds_proxy.py — RDS Proxy with IAM auth + security groups."""
import logging

import click

from shared.config import SESSION, TAGS, RDS_INSTANCE_ID, RDS_PROXY_NAME
from shared.idempotent import get_or_create, safe_delete
from shared.waits import wait_for_rds_proxy_available
from shared import state

logger = logging.getLogger(__name__)

rds = SESSION.client("rds")
ec2 = SESSION.client("ec2")

PROXY_SG_NAME = "campuspandit-proxy-sg"


def _default_vpc_id() -> str:
    resp = ec2.describe_vpcs(Filters=[{"Name": "isDefault", "Values": ["true"]}])
    return resp["Vpcs"][0]["VpcId"]


def _default_subnet_ids() -> list[str]:
    vpc_id = _default_vpc_id()
    resp = ec2.describe_subnets(
        Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
    )
    return [s["SubnetId"] for s in resp["Subnets"]]


def _get_sg_id(name: str) -> str | None:
    resp = ec2.describe_security_groups(
        Filters=[{"Name": "group-name", "Values": [name]}]
    )
    sgs = resp["SecurityGroups"]
    return sgs[0]["GroupId"] if sgs else None


def up() -> None:
    """Provision RDS Proxy. Idempotent."""
    rds_sg_id = state.get("/campuspandit/deploy/rds/security_group_id")
    if not rds_sg_id:
        raise RuntimeError("RDS security group not found in SSM. Run 03_rds.py up first.")

    secret_arn = state.get("/campuspandit/deploy/rds/secret_arn")
    if not secret_arn:
        raise RuntimeError("RDS secret ARN not found in SSM. Run 03_rds.py up first.")

    proxy_role_arn = state.get("/campuspandit/deploy/iam/rds_proxy_role_arn")
    if not proxy_role_arn:
        raise RuntimeError("Proxy role ARN not found in SSM. Run 01_iam.py up first.")

    vpc_id = _default_vpc_id()
    subnet_ids = _default_subnet_ids()

    # --- Proxy security group ---
    proxy_sg_id = _get_sg_id(PROXY_SG_NAME)
    if not proxy_sg_id:
        resp = ec2.create_security_group(
            GroupName=PROXY_SG_NAME,
            Description="CampusPandit RDS Proxy - inbound 5432 from lambda-sg",
            VpcId=vpc_id,
            TagSpecifications=[{
                "ResourceType": "security-group",
                "Tags": TAGS,
            }],
        )
        proxy_sg_id = resp["GroupId"]
        logger.info("Created proxy security group: %s", proxy_sg_id)
    else:
        logger.info("Proxy security group already exists: %s", proxy_sg_id)

    state.set("/campuspandit/deploy/proxy/security_group_id", proxy_sg_id)

    # --- Allow rds-sg to accept traffic from proxy-sg on 5432 ---
    # Check existing ingress rules to avoid duplicate-rule error
    rds_sg_resp = ec2.describe_security_groups(GroupIds=[rds_sg_id])
    rds_sg_rules = rds_sg_resp["SecurityGroups"][0].get("IpPermissions", [])
    proxy_rule_exists = any(
        perm.get("FromPort") == 5432
        and any(
            ug.get("GroupId") == proxy_sg_id
            for ug in perm.get("UserIdGroupPairs", [])
        )
        for perm in rds_sg_rules
    )
    if not proxy_rule_exists:
        ec2.authorize_security_group_ingress(
            GroupId=rds_sg_id,
            IpPermissions=[{
                "IpProtocol": "tcp",
                "FromPort": 5432,
                "ToPort": 5432,
                "UserIdGroupPairs": [{"GroupId": proxy_sg_id, "Description": "from-rds-proxy"}],
            }],
        )
        logger.info("Added proxy-sg → rds-sg ingress rule on port 5432.")
    else:
        logger.info("proxy-sg → rds-sg ingress rule already exists.")

    # --- Create RDS Proxy ---
    try:
        desc = rds.describe_db_proxies(DBProxyName=RDS_PROXY_NAME)
        proxy_arn = desc["DBProxies"][0]["DBProxyArn"]
        proxy_endpoint = desc["DBProxies"][0]["Endpoint"]
        logger.info("RDS Proxy already exists — endpoint: %s", proxy_endpoint)
    except rds.exceptions.DBProxyNotFoundFault:
        logger.info("Creating RDS Proxy %s ...", RDS_PROXY_NAME)
        resp = rds.create_db_proxy(
            DBProxyName=RDS_PROXY_NAME,
            EngineFamily="POSTGRESQL",
            Auth=[{
                "AuthScheme": "SECRETS",
                "SecretArn": secret_arn,
                "IAMAuth": "REQUIRED",
            }],
            RoleArn=proxy_role_arn,
            VpcSubnetIds=subnet_ids,
            VpcSecurityGroupIds=[proxy_sg_id],
            RequireTLS=True,
            Tags=TAGS,
        )
        proxy_arn = resp["DBProxy"]["DBProxyArn"]
        wait_for_rds_proxy_available(RDS_PROXY_NAME)
        desc = rds.describe_db_proxies(DBProxyName=RDS_PROXY_NAME)
        proxy_endpoint = desc["DBProxies"][0]["Endpoint"]
        logger.info("RDS Proxy created — endpoint: %s", proxy_endpoint)

    # --- Register RDS instance as proxy target ---
    target_groups = rds.describe_db_proxy_target_groups(DBProxyName=RDS_PROXY_NAME)
    tg_name = target_groups["TargetGroups"][0]["TargetGroupName"]
    existing_targets = rds.describe_db_proxy_targets(DBProxyName=RDS_PROXY_NAME)
    if not existing_targets.get("Targets"):
        rds.register_db_proxy_targets(
            DBProxyName=RDS_PROXY_NAME,
            TargetGroupName=tg_name,
            DBInstanceIdentifiers=[RDS_INSTANCE_ID],
        )
        logger.info("Registered %s as proxy target.", RDS_INSTANCE_ID)
    else:
        logger.info("Proxy target already registered.")

    # Capture resource ID (used in Lambda IAM policy)
    proxy_resource_id = proxy_arn.split(":")[-1]

    state.set("/campuspandit/deploy/proxy/endpoint", proxy_endpoint)
    state.set("/campuspandit/deploy/proxy/resource_id", proxy_resource_id)
    logger.info("04_rds_proxy: up complete.")


def down() -> None:
    """Tear down RDS Proxy. Idempotent."""
    # Deregister DB targets
    try:
        target_groups = rds.describe_db_proxy_target_groups(DBProxyName=RDS_PROXY_NAME)
        tg_name = target_groups["TargetGroups"][0]["TargetGroupName"]
        targets = rds.describe_db_proxy_targets(DBProxyName=RDS_PROXY_NAME).get("Targets", [])
        if targets:
            rds.deregister_db_proxy_targets(
                DBProxyName=RDS_PROXY_NAME,
                TargetGroupName=tg_name,
                DBInstanceIdentifiers=[RDS_INSTANCE_ID],
            )
            logger.info("Deregistered proxy targets.")
    except rds.exceptions.DBProxyNotFoundFault:
        pass

    safe_delete(
        lambda: rds.delete_db_proxy(DBProxyName=RDS_PROXY_NAME),
        rds.exceptions.DBProxyNotFoundFault,
    )
    logger.info("RDS Proxy deleted (or already absent).")

    proxy_sg_id = state.get("/campuspandit/deploy/proxy/security_group_id")
    if proxy_sg_id:
        # B3: catch only InvalidGroup.NotFound, not broad ClientError
        try:
            ec2.delete_security_group(GroupId=proxy_sg_id)
            logger.info("Deleted proxy security group %s", proxy_sg_id)
        except ec2.exceptions.ClientError as e:
            if e.response["Error"]["Code"] != "InvalidGroup.NotFound":
                raise
            logger.info("Proxy security group %s already absent", proxy_sg_id)

    for param in [
        "/campuspandit/deploy/proxy/endpoint",
        "/campuspandit/deploy/proxy/resource_id",
        "/campuspandit/deploy/proxy/security_group_id",
    ]:
        state.delete(param)
    logger.info("04_rds_proxy: down complete.")


@click.command()
@click.argument("action", type=click.Choice(["up", "down"]))
def cli(action: str) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
    {"up": up, "down": down}[action]()


if __name__ == "__main__":
    cli()
