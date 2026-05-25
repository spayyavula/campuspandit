"""08_cognito.py — Empty Cognito user pool + app client (Stage 2 stub)."""
import logging

import click

from shared.config import SESSION, REGION, TAGS, COGNITO_POOL_NAME
from shared.idempotent import safe_delete
from shared import state

logger = logging.getLogger(__name__)

cognito = SESSION.client("cognito-idp")

APP_CLIENT_NAME = "campuspandit-web"


def _get_pool_id() -> str | None:
    """Return the user pool ID for campuspandit-users, or None."""
    paginator = cognito.get_paginator("list_user_pools")
    for page in paginator.paginate(MaxResults=60):
        for pool in page["UserPools"]:
            if pool["Name"] == COGNITO_POOL_NAME:
                return pool["Id"]
    return None


def _get_client_id(pool_id: str) -> str | None:
    """Return the app client ID for campuspandit-web, or None."""
    paginator = cognito.get_paginator("list_user_pool_clients")
    for page in paginator.paginate(UserPoolId=pool_id, MaxResults=60):
        for client in page["UserPoolClients"]:
            if client["ClientName"] == APP_CLIENT_NAME:
                return client["ClientId"]
    return None


def up() -> None:
    """Provision Cognito user pool. Idempotent."""
    pool_id = _get_pool_id()
    if not pool_id:
        logger.info("Creating Cognito user pool '%s' ...", COGNITO_POOL_NAME)
        resp = cognito.create_user_pool(
            PoolName=COGNITO_POOL_NAME,
            UsernameAttributes=["email"],
            AutoVerifiedAttributes=["email"],
            Policies={
                "PasswordPolicy": {
                    "MinimumLength": 8,
                    "RequireUppercase": True,
                    "RequireLowercase": True,
                    "RequireNumbers": True,
                    "RequireSymbols": False,
                }
            },
            Schema=[{
                "Name": "email",
                "AttributeDataType": "String",
                "Required": True,
                "Mutable": True,
            }],
            MfaConfiguration="OFF",
            AdminCreateUserConfig={"AllowAdminCreateUserOnly": False},
            UserPoolTags={t["Key"]: t["Value"] for t in TAGS},
        )
        pool_id = resp["UserPool"]["Id"]
        logger.info("Cognito user pool created: %s", pool_id)
    else:
        logger.info("Cognito user pool already exists: %s", pool_id)

    state.set("/campuspandit/deploy/cognito/pool_id", pool_id)

    # --- App client ---
    client_id = _get_client_id(pool_id)
    if not client_id:
        logger.info("Creating Cognito app client '%s' ...", APP_CLIENT_NAME)
        resp = cognito.create_user_pool_client(
            UserPoolId=pool_id,
            ClientName=APP_CLIENT_NAME,
            GenerateSecret=False,
            ExplicitAuthFlows=[
                "ALLOW_USER_SRP_AUTH",
                "ALLOW_REFRESH_TOKEN_AUTH",
            ],
        )
        client_id = resp["UserPoolClient"]["ClientId"]
        logger.info("Cognito app client created: %s", client_id)
    else:
        logger.info("Cognito app client already exists: %s", client_id)

    state.set("/campuspandit/deploy/cognito/client_id", client_id)
    logger.info(
        "Cognito pool_id=%s client_id=%s stored in SSM. "
        "Not consumed by the app in Phase 1 — wired when Stage 2 fires.",
        pool_id, client_id,
    )
    logger.info("08_cognito: up complete.")


def down() -> None:
    """Tear down Cognito user pool. Idempotent."""
    pool_id = state.get("/campuspandit/deploy/cognito/pool_id") or _get_pool_id()
    if pool_id:
        # Delete app client first
        client_id = state.get("/campuspandit/deploy/cognito/client_id") or _get_client_id(pool_id)
        if client_id:
            safe_delete(
                lambda: cognito.delete_user_pool_client(
                    UserPoolId=pool_id, ClientId=client_id
                ),
                cognito.exceptions.ResourceNotFoundException,
            )
            logger.info("Cognito app client deleted.")

        safe_delete(
            lambda: cognito.delete_user_pool(UserPoolId=pool_id),
            cognito.exceptions.ResourceNotFoundException,
        )
        logger.info("Cognito user pool %s deleted (or already absent).", pool_id)
    else:
        logger.info("No Cognito user pool found — skipping.")

    for param in [
        "/campuspandit/deploy/cognito/pool_id",
        "/campuspandit/deploy/cognito/client_id",
    ]:
        state.delete(param)
    logger.info("08_cognito: down complete.")


@click.command()
@click.argument("action", type=click.Choice(["up", "down"]))
def cli(action: str) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
    {"up": up, "down": down}[action]()


if __name__ == "__main__":
    cli()
