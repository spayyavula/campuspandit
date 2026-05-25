"""06_lambdas.py — Lambda layer + 5 functions + VPC config + security group."""
import io
import json
import logging
import os
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from pathlib import Path

import click

from shared.config import SESSION, ACCOUNT_ID, REGION, TAGS, LAMBDA_HANDLERS
from shared.idempotent import get_or_create, safe_delete
from shared.waits import wait_for_lambda_active
from shared import state

logger = logging.getLogger(__name__)

lmb = SESSION.client("lambda")
ec2 = SESSION.client("ec2")
iam = SESSION.client("iam")

LAYER_NAME = "campuspandit-lambda-layer"
LAMBDA_SG_NAME = "campuspandit-lambda-sg"

# Path resolution: this script is at infrastructure/deploy/06_lambdas.py
_DEPLOY_DIR = Path(__file__).parent
_LAMBDA_DIR = _DEPLOY_DIR.parent / "lambda"


def _handler_to_function_name(handler: str) -> str:
    return handler.replace("_", "-")


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


def _build_layer_zip() -> bytes:
    """Install layer deps into a temp dir and zip as a Lambda layer."""
    requirements_file = _LAMBDA_DIR / "requirements.txt"
    with tempfile.TemporaryDirectory() as tmpdir:
        python_dir = os.path.join(tmpdir, "python")
        os.makedirs(python_dir)
        logger.info("Installing Lambda layer dependencies ...")
        subprocess.run(
            [
                sys.executable, "-m", "pip", "install",
                "-r", str(requirements_file),
                "-t", python_dir,
                "--quiet",
            ],
            check=True,
        )
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, _dirs, files in os.walk(tmpdir):
                for fname in files:
                    full_path = os.path.join(root, fname)
                    arc_name = os.path.relpath(full_path, tmpdir)
                    zf.write(full_path, arc_name)
        return buf.getvalue()


def _wait_for_eni_cleanup(sg_id: str, timeout: int = 1500) -> None:
    """Poll until all Lambda ENIs detach from sg_id (can take up to 20 min)."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        enis = ec2.describe_network_interfaces(
            Filters=[{"Name": "group-id", "Values": [sg_id]}]
        )["NetworkInterfaces"]
        if not enis:
            logger.info("All ENIs cleared from sg %s", sg_id)
            return
        logger.info("Waiting for %d ENI(s) to detach from sg %s ...", len(enis), sg_id)
        time.sleep(30)
    raise RuntimeError(f"ENI cleanup timed out for sg {sg_id} after {timeout}s")


def _build_function_zip(handler: str) -> bytes:
    """Package handler.py + shared/ into a Lambda deployment zip."""
    handler_file = _LAMBDA_DIR / f"{handler}.py"
    shared_dir = _LAMBDA_DIR / "shared"

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # Handler renamed to index.py (Lambda expects handler=index.lambda_handler)
        zf.write(str(handler_file), "index.py")
        # shared/ package
        for src in shared_dir.rglob("*"):
            if src.is_file() and "__pycache__" not in src.parts:
                arc_name = "shared/" + src.relative_to(shared_dir).as_posix()
                zf.write(str(src), arc_name)
    return buf.getvalue()


def up() -> None:
    """Provision Lambda layer + functions. Idempotent."""
    exec_role_arn = state.get("/campuspandit/deploy/iam/lambda_exec_role_arn")
    if not exec_role_arn:
        raise RuntimeError("Lambda exec role ARN not found. Run 01_iam.py up first.")

    proxy_host = state.get("/campuspandit/deploy/proxy/endpoint")
    if not proxy_host:
        raise RuntimeError("Proxy endpoint not found. Run 04_rds_proxy.py up first.")

    proxy_resource_id = state.get("/campuspandit/deploy/proxy/resource_id")
    proxy_sg_id = state.get("/campuspandit/deploy/proxy/security_group_id")
    if not proxy_sg_id:
        raise RuntimeError("Proxy security group ID not found. Run 04_rds_proxy.py up first.")

    vpc_id = _default_vpc_id()
    subnet_ids = _default_subnet_ids()

    # --- Lambda security group ---
    lambda_sg_id = _get_sg_id(LAMBDA_SG_NAME)
    if not lambda_sg_id:
        resp = ec2.create_security_group(
            GroupName=LAMBDA_SG_NAME,
            Description="CampusPandit Lambda — no inbound; outbound 5432 to proxy-sg",
            VpcId=vpc_id,
            TagSpecifications=[{
                "ResourceType": "security-group",
                "Tags": TAGS,
            }],
        )
        lambda_sg_id = resp["GroupId"]
        logger.info("Created lambda security group: %s", lambda_sg_id)
    else:
        logger.info("Lambda security group already exists: %s", lambda_sg_id)

    state.set("/campuspandit/deploy/lambdas/security_group_id", lambda_sg_id)

    # Allow lambda-sg to reach proxy-sg on 5432
    # Egress rule: lambda-sg outbound to proxy-sg
    lambda_sg_resp = ec2.describe_security_groups(GroupIds=[lambda_sg_id])
    egress_rules = lambda_sg_resp["SecurityGroups"][0].get("IpPermissionsEgress", [])
    proxy_egress_exists = any(
        perm.get("FromPort") == 5432
        and any(
            ug.get("GroupId") == proxy_sg_id
            for ug in perm.get("UserIdGroupPairs", [])
        )
        for perm in egress_rules
    )
    if not proxy_egress_exists:
        # Remove the default "allow all" egress if present, then add specific rule
        try:
            ec2.revoke_security_group_egress(
                GroupId=lambda_sg_id,
                IpPermissions=[{
                    "IpProtocol": "-1",
                    "IpRanges": [{"CidrIp": "0.0.0.0/0"}],
                }],
            )
        except ec2.exceptions.ClientError:
            pass  # Already removed or different default
        ec2.authorize_security_group_egress(
            GroupId=lambda_sg_id,
            IpPermissions=[{
                "IpProtocol": "tcp",
                "FromPort": 5432,
                "ToPort": 5432,
                "UserIdGroupPairs": [{"GroupId": proxy_sg_id, "Description": "to-rds-proxy"}],
            }],
        )
        logger.info("Lambda SG egress to proxy-sg on 5432 configured.")

    # Allow proxy-sg to accept ingress from lambda-sg on 5432
    proxy_sg_resp = ec2.describe_security_groups(GroupIds=[proxy_sg_id])
    proxy_ingress_rules = proxy_sg_resp["SecurityGroups"][0].get("IpPermissions", [])
    lambda_ingress_exists = any(
        perm.get("FromPort") == 5432
        and any(
            ug.get("GroupId") == lambda_sg_id
            for ug in perm.get("UserIdGroupPairs", [])
        )
        for perm in proxy_ingress_rules
    )
    if not lambda_ingress_exists:
        ec2.authorize_security_group_ingress(
            GroupId=proxy_sg_id,
            IpPermissions=[{
                "IpProtocol": "tcp",
                "FromPort": 5432,
                "ToPort": 5432,
                "UserIdGroupPairs": [{"GroupId": lambda_sg_id, "Description": "from-lambda"}],
            }],
        )
        logger.info("Added lambda-sg → proxy-sg ingress rule on port 5432.")

    # --- Lambda layer ---
    # I3: always rebuild + republish so requirements.txt changes are picked up
    logger.info("Building Lambda layer (rebuilds every run)")
    layer_zip = _build_layer_zip()
    layer_resp = lmb.publish_layer_version(
        LayerName=LAYER_NAME,
        Description="psycopg[binary] + pydantic for campuspandit Lambdas",
        Content={"ZipFile": layer_zip},
        CompatibleRuntimes=["python3.12"],
        CompatibleArchitectures=["x86_64"],
    )
    layer_arn = layer_resp["LayerVersionArn"]
    logger.info("Lambda layer published: %s", layer_arn)
    state.set("/campuspandit/deploy/lambdas/layer_arn", layer_arn)

    # --- Lambda functions ---
    env_vars = {
        "DATABASE_PROXY_HOST": proxy_host,
        "DATABASE_NAME": "campuspandit",
        "AWS_REGION_NAME": REGION,  # avoid shadowing AWS_REGION (reserved)
    }

    for handler in LAMBDA_HANDLERS:
        fn_name = _handler_to_function_name(handler)
        fn_zip = _build_function_zip(handler)
        ssm_key = f"/campuspandit/deploy/lambdas/{handler}/arn"

        try:
            existing = lmb.get_function(FunctionName=fn_name)
            fn_arn = existing["Configuration"]["FunctionArn"]
            logger.info("Lambda %s already exists — updating code ...", fn_name)
            lmb.update_function_code(
                FunctionName=fn_name,
                ZipFile=fn_zip,
            )
            lmb.get_waiter("function_updated").wait(FunctionName=fn_name)  # I4
            lmb.update_function_configuration(
                FunctionName=fn_name,
                Layers=[layer_arn],
                Environment={"Variables": env_vars},
                VpcConfig={
                    "SubnetIds": subnet_ids,
                    "SecurityGroupIds": [lambda_sg_id],
                },
            )
        except lmb.exceptions.ResourceNotFoundException:
            logger.info("Creating Lambda %s ...", fn_name)
            resp = lmb.create_function(
                FunctionName=fn_name,
                Runtime="python3.12",
                Architectures=["x86_64"],
                Role=exec_role_arn,
                Handler="index.lambda_handler",
                Code={"ZipFile": fn_zip},
                Timeout=10,
                MemorySize=128,
                Layers=[layer_arn],
                Environment={"Variables": env_vars},
                VpcConfig={
                    "SubnetIds": subnet_ids,
                    "SecurityGroupIds": [lambda_sg_id],
                },
                Tags={t["Key"]: t["Value"] for t in TAGS},
            )
            fn_arn = resp["FunctionArn"]

        wait_for_lambda_active(fn_name)
        state.set(ssm_key, fn_arn)
        logger.info("Lambda %s ready: %s", fn_name, fn_arn)

    # --- Narrow lambda exec role inline policy to actual proxy resource ---
    if proxy_resource_id:
        narrow_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["rds-db:connect"],
                "Resource": (
                    f"arn:aws:rds-db:{REGION}:{ACCOUNT_ID}:dbuser:"
                    f"{proxy_resource_id}/lambda_app"
                ),
            }],
        })
        lambda_role_name = "campuspandit-lambda-exec-role"
        iam.put_role_policy(
            RoleName=lambda_role_name,
            PolicyName="RdsIamConnect",
            PolicyDocument=narrow_policy,
        )
        logger.info("Lambda exec role inline policy narrowed to proxy resource %s.", proxy_resource_id)

    logger.info("06_lambdas: up complete.")


def down() -> None:
    """Tear down Lambda functions + layer. Idempotent."""
    for handler in LAMBDA_HANDLERS:
        fn_name = _handler_to_function_name(handler)
        safe_delete(
            lambda n=fn_name: lmb.delete_function(FunctionName=n),
            lmb.exceptions.ResourceNotFoundException,
        )
        logger.info("Lambda %s deleted (or already absent).", fn_name)
        state.delete(f"/campuspandit/deploy/lambdas/{handler}/arn")

    # Delete all layer versions
    layer_arn = state.get("/campuspandit/deploy/lambdas/layer_arn")
    if layer_arn:
        try:
            versions = lmb.list_layer_versions(LayerName=LAYER_NAME)["LayerVersions"]
            for v in versions:
                lmb.delete_layer_version(
                    LayerName=LAYER_NAME,
                    VersionNumber=v["Version"],
                )
                logger.info("Deleted layer version %s.", v["Version"])
        except lmb.exceptions.ResourceNotFoundException:
            pass
        state.delete("/campuspandit/deploy/lambdas/layer_arn")

    lambda_sg_id = state.get("/campuspandit/deploy/lambdas/security_group_id")
    if lambda_sg_id:
        # B3: wait for Lambda ENIs to detach before deleting the SG
        _wait_for_eni_cleanup(lambda_sg_id)
        try:
            ec2.delete_security_group(GroupId=lambda_sg_id)
            logger.info("Deleted Lambda security group %s", lambda_sg_id)
        except ec2.exceptions.ClientError as e:
            if e.response["Error"]["Code"] != "InvalidGroup.NotFound":
                raise
            logger.info("Lambda security group %s already absent", lambda_sg_id)
        state.delete("/campuspandit/deploy/lambdas/security_group_id")

    logger.info("06_lambdas: down complete.")


@click.command()
@click.argument("action", type=click.Choice(["up", "down"]))
def cli(action: str) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
    {"up": up, "down": down}[action]()


if __name__ == "__main__":
    cli()
