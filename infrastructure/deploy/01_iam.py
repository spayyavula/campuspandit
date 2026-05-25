"""01_iam.py — CI user + Lambda exec role + RDS Proxy role."""
import json
import logging

import click

from shared.config import SESSION, ACCOUNT_ID, TAGS
from shared.idempotent import get_or_create, safe_delete
from shared import state

logger = logging.getLogger(__name__)

iam = SESSION.client("iam")

CI_USER_NAME = "campuspandit-ci"
LAMBDA_ROLE_NAME = "campuspandit-lambda-exec-role"
PROXY_ROLE_NAME = "campuspandit-rds-proxy-role"
CI_POLICY_NAME = "CampuspanditCIPolicy"

CI_POLICY_DOC = json.dumps({
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AmplifyAndS3Deploy",
            "Effect": "Allow",
            "Action": [
                "amplify:*",
                "s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket",
            ],
            "Resource": "*",
        },
        {
            "Sid": "LambdaUpdate",
            "Effect": "Allow",
            "Action": [
                "lambda:UpdateFunctionCode",
                "lambda:GetFunction",
                "lambda:PublishLayerVersion",
                "lambda:ListLayerVersions",
            ],
            "Resource": "*",
        },
        {
            "Sid": "ReadSSMSecrets",
            "Effect": "Allow",
            "Action": ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"],
            "Resource": "*",
        },
    ],
})

LAMBDA_TRUST_POLICY = json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole",
    }],
})

LAMBDA_INLINE_POLICY = json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": ["rds-db:connect"],
        # Narrowed to actual proxy resource ID in 06_lambdas.py after proxy is created.
        # Wildcard is intentional for Phase 1 bootstrap.
        "Resource": f"arn:aws:rds-db:*:{ACCOUNT_ID}:dbuser:*/lambda_app",
    }],
})

PROXY_TRUST_POLICY = json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "rds.amazonaws.com"},
        "Action": "sts:AssumeRole",
    }],
})

PROXY_INLINE_POLICY = json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": [
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret",
        ],
        # Narrowed to actual secret ARN in 03_rds.py after secret is created.
        "Resource": "*",
    }],
})


def up() -> None:
    """Provision IAM resources. Idempotent."""
    # --- CI user ---
    user = get_or_create(
        lambda: iam.get_user(UserName=CI_USER_NAME)["User"],
        lambda: iam.create_user(
            UserName=CI_USER_NAME,
            Tags=TAGS,
        )["User"],
        iam.exceptions.NoSuchEntityException,
    )
    ci_user_arn = user["Arn"]
    logger.info("CI user: %s", ci_user_arn)

    # Attach inline policy (put_user_policy is idempotent by name)
    iam.put_user_policy(
        UserName=CI_USER_NAME,
        PolicyName=CI_POLICY_NAME,
        PolicyDocument=CI_POLICY_DOC,
    )
    logger.info("Inline policy %s attached to %s.", CI_POLICY_NAME, CI_USER_NAME)

    # Create access key only for a newly created user (no existing keys)
    existing_keys = iam.list_access_keys(UserName=CI_USER_NAME)["AccessKeyMetadata"]
    if not existing_keys:
        key = iam.create_access_key(UserName=CI_USER_NAME)["AccessKey"]
        logger.info(
            "ACCESS KEY CREATED — copy these now (secret shown once):\n"
            "  AWS_ACCESS_KEY_ID     = %s\n"
            "  AWS_SECRET_ACCESS_KEY = %s",
            key["AccessKeyId"],
            key["SecretAccessKey"],
        )
    else:
        logger.info(
            "Access key already exists for %s — skipping creation. "
            "Rotate manually if needed.",
            CI_USER_NAME,
        )

    # --- Lambda execution role ---
    lambda_role = get_or_create(
        lambda: iam.get_role(RoleName=LAMBDA_ROLE_NAME)["Role"],
        lambda: iam.create_role(
            RoleName=LAMBDA_ROLE_NAME,
            AssumeRolePolicyDocument=LAMBDA_TRUST_POLICY,
            Tags=TAGS,
        )["Role"],
        iam.exceptions.NoSuchEntityException,
    )
    lambda_role_arn = lambda_role["Arn"]

    iam.attach_role_policy(
        RoleName=LAMBDA_ROLE_NAME,
        PolicyArn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
    )
    iam.put_role_policy(
        RoleName=LAMBDA_ROLE_NAME,
        PolicyName="RdsIamConnect",
        PolicyDocument=LAMBDA_INLINE_POLICY,
    )
    logger.info("Lambda exec role: %s", lambda_role_arn)

    # --- RDS Proxy role ---
    proxy_role = get_or_create(
        lambda: iam.get_role(RoleName=PROXY_ROLE_NAME)["Role"],
        lambda: iam.create_role(
            RoleName=PROXY_ROLE_NAME,
            AssumeRolePolicyDocument=PROXY_TRUST_POLICY,
            Tags=TAGS,
        )["Role"],
        iam.exceptions.NoSuchEntityException,
    )
    proxy_role_arn = proxy_role["Arn"]
    iam.put_role_policy(
        RoleName=PROXY_ROLE_NAME,
        PolicyName="SecretsManagerRead",
        PolicyDocument=PROXY_INLINE_POLICY,
    )
    logger.info("RDS Proxy role: %s", proxy_role_arn)

    # --- Write outputs to SSM ---
    state.set("/campuspandit/deploy/iam/ci_user_arn", ci_user_arn)
    state.set("/campuspandit/deploy/iam/lambda_exec_role_arn", lambda_role_arn)
    state.set("/campuspandit/deploy/iam/rds_proxy_role_arn", proxy_role_arn)
    logger.info("01_iam: up complete.")


def down() -> None:
    """Tear down IAM resources. Idempotent."""
    # Delete CI user access keys first (required before deleting user)
    try:
        keys = iam.list_access_keys(UserName=CI_USER_NAME)["AccessKeyMetadata"]
        for k in keys:
            iam.delete_access_key(UserName=CI_USER_NAME, AccessKeyId=k["AccessKeyId"])
            logger.info("Deleted access key %s.", k["AccessKeyId"])
    except iam.exceptions.NoSuchEntityException:
        pass

    # Delete CI user inline policy then the user
    safe_delete(
        lambda: iam.delete_user_policy(UserName=CI_USER_NAME, PolicyName=CI_POLICY_NAME),
        iam.exceptions.NoSuchEntityException,
    )
    safe_delete(
        lambda: iam.delete_user(UserName=CI_USER_NAME),
        iam.exceptions.NoSuchEntityException,
    )
    logger.info("CI user deleted (or already absent).")

    # Lambda exec role: detach managed policies, delete inline, delete role
    for policy_arn in [
        "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
    ]:
        safe_delete(
            lambda pa=policy_arn: iam.detach_role_policy(
                RoleName=LAMBDA_ROLE_NAME, PolicyArn=pa
            ),
            iam.exceptions.NoSuchEntityException,
        )
    safe_delete(
        lambda: iam.delete_role_policy(RoleName=LAMBDA_ROLE_NAME, PolicyName="RdsIamConnect"),
        iam.exceptions.NoSuchEntityException,
    )
    safe_delete(
        lambda: iam.delete_role(RoleName=LAMBDA_ROLE_NAME),
        iam.exceptions.NoSuchEntityException,
    )
    logger.info("Lambda exec role deleted (or already absent).")

    # Proxy role
    safe_delete(
        lambda: iam.delete_role_policy(
            RoleName=PROXY_ROLE_NAME, PolicyName="SecretsManagerRead"
        ),
        iam.exceptions.NoSuchEntityException,
    )
    safe_delete(
        lambda: iam.delete_role(RoleName=PROXY_ROLE_NAME),
        iam.exceptions.NoSuchEntityException,
    )
    logger.info("RDS Proxy role deleted (or already absent).")

    # Clean SSM
    for param in [
        "/campuspandit/deploy/iam/ci_user_arn",
        "/campuspandit/deploy/iam/lambda_exec_role_arn",
        "/campuspandit/deploy/iam/rds_proxy_role_arn",
    ]:
        state.delete(param)
    logger.info("01_iam: down complete.")


@click.command()
@click.argument("action", type=click.Choice(["up", "down"]))
def cli(action: str) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
    {"up": up, "down": down}[action]()


if __name__ == "__main__":
    cli()
