"""05_api_gateway.py — HTTP API + 5 routes + CORS + Lambda integrations.

Dependency order note: 06_lambdas.py must run before this script so that
Lambda ARNs are available in SSM. deploy.py orders: 06 -> 05.
"""
import logging

import click

from shared.config import SESSION, ACCOUNT_ID, REGION, TAGS, API_NAME, LAMBDA_HANDLERS
from shared.idempotent import safe_delete
from shared import state

logger = logging.getLogger(__name__)

apigw = SESSION.client("apigatewayv2")
lmb = SESSION.client("lambda")

# Route definitions: (method, path, handler_name)
ROUTES = [
    ("POST", "/pilot-applications", "pilot_application_write"),
    ("POST", "/feature-requests", "feature_request_write"),
    ("GET", "/feature-requests", "feature_request_read"),
    ("POST", "/engagement-signals", "engagement_signal_write"),
    ("POST", "/votes", "vote_write"),
]


def _handler_to_function_name(handler: str) -> str:
    return handler.replace("_", "-")


def _get_api_id() -> str | None:
    """Return the API Gateway ID for campuspandit-observe, or None."""
    paginator = apigw.get_paginator("get_apis")
    for page in paginator.paginate():
        for api in page["Items"]:
            if api["Name"] == API_NAME:
                return api["ApiId"]
    return None


def _amplify_cors_origin() -> str | None:
    """Return the Amplify default domain CORS origin if Amplify app exists."""
    app_id = state.get("/campuspandit/deploy/amplify/app_id")
    if app_id:
        return f"https://main.{app_id}.amplifyapp.com"
    return None


def up() -> None:
    """Provision API Gateway HTTP API. Idempotent."""
    # Build CORS allowed origins
    cors_origins = ["https://www.campuspandit.ai"]
    amplify_origin = _amplify_cors_origin()
    if amplify_origin:
        cors_origins.append(amplify_origin)

    api_id = _get_api_id()
    if not api_id:
        logger.info("Creating HTTP API '%s' ...", API_NAME)
        resp = apigw.create_api(
            Name=API_NAME,
            ProtocolType="HTTP",
            CorsConfiguration={
                "AllowOrigins": cors_origins,
                "AllowMethods": ["GET", "POST", "OPTIONS"],
                "AllowHeaders": ["Content-Type"],
                "MaxAge": 3600,
            },
            Tags={t["Key"]: t["Value"] for t in TAGS},
        )
        api_id = resp["ApiId"]
        logger.info("HTTP API created: %s", api_id)

        # Auto-deploy $default stage
        apigw.create_stage(
            ApiId=api_id,
            StageName="$default",
            AutoDeploy=True,
            Tags={t["Key"]: t["Value"] for t in TAGS},
        )
        logger.info("Auto-deploy stage '$default' created.")
    else:
        logger.info("HTTP API already exists: %s", api_id)
        # Update CORS origins in case Amplify app was created after first run
        apigw.update_api(
            ApiId=api_id,
            CorsConfiguration={
                "AllowOrigins": cors_origins,
                "AllowMethods": ["GET", "POST", "OPTIONS"],
                "AllowHeaders": ["Content-Type"],
                "MaxAge": 3600,
            },
        )

    invoke_url = f"https://{api_id}.execute-api.{REGION}.amazonaws.com"

    # --- Wire Lambda integrations + routes ---
    existing_routes = {
        r["RouteKey"]: r["RouteId"]
        for r in apigw.get_routes(ApiId=api_id)["Items"]
    }
    existing_integrations = {
        i["IntegrationUri"]: i["IntegrationId"]
        for i in apigw.get_integrations(ApiId=api_id)["Items"]
        if i.get("IntegrationUri")
    }

    for method, path, handler in ROUTES:
        route_key = f"{method} {path}"
        fn_name = _handler_to_function_name(handler)
        fn_arn = state.get(f"/campuspandit/deploy/lambdas/{handler}/arn")

        if not fn_arn:
            logger.warning(
                "Lambda ARN for %s not found in SSM — skipping route %s. "
                "Run 06_lambdas.py up first, then re-run 05_api_gateway.py up.",
                handler, route_key,
            )
            continue

        lambda_arn = f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{fn_arn}/invocations"

        # Create integration if missing
        if lambda_arn not in existing_integrations:
            integ = apigw.create_integration(
                ApiId=api_id,
                IntegrationType="AWS_PROXY",
                IntegrationUri=lambda_arn,
                PayloadFormatVersion="2.0",
            )
            integration_id = integ["IntegrationId"]
            existing_integrations[lambda_arn] = integration_id
            logger.info("Created integration for %s: %s", fn_name, integration_id)
        else:
            integration_id = existing_integrations[lambda_arn]

        # Create route if missing
        if route_key not in existing_routes:
            apigw.create_route(
                ApiId=api_id,
                RouteKey=route_key,
                Target=f"integrations/{integration_id}",
            )
            logger.info("Created route: %s -> %s", route_key, fn_name)
        else:
            logger.info("Route already exists: %s", route_key)

        # Grant API Gateway permission to invoke the Lambda
        statement_id = f"apigw-{method.lower()}-{path.strip('/').replace('/', '-')}"
        try:
            lmb.add_permission(
                FunctionName=fn_arn,
                StatementId=statement_id,
                Action="lambda:InvokeFunction",
                Principal="apigateway.amazonaws.com",
                SourceArn=f"arn:aws:execute-api:{REGION}:{ACCOUNT_ID}:{api_id}/*/*{path}",
            )
            logger.info("Lambda invoke permission added for %s.", fn_name)
        except lmb.exceptions.ResourceConflictException:
            logger.info("Lambda invoke permission already exists for %s.", fn_name)

    state.set("/campuspandit/deploy/api_gateway/id", api_id)
    state.set("/campuspandit/deploy/api_gateway/invoke_url", invoke_url)
    logger.info("API Gateway invoke URL: %s", invoke_url)
    logger.info("05_api_gateway: up complete.")


def down() -> None:
    """Tear down HTTP API. Idempotent."""
    api_id = state.get("/campuspandit/deploy/api_gateway/id") or _get_api_id()
    if api_id:
        safe_delete(
            lambda: apigw.delete_api(ApiId=api_id),
            apigw.exceptions.NotFoundException,
        )
        logger.info("HTTP API %s deleted (or already absent).", api_id)
    else:
        logger.info("No API Gateway ID found — skipping.")

    for param in [
        "/campuspandit/deploy/api_gateway/id",
        "/campuspandit/deploy/api_gateway/invoke_url",
    ]:
        state.delete(param)
    logger.info("05_api_gateway: down complete.")


@click.command()
@click.argument("action", type=click.Choice(["up", "down"]))
def cli(action: str) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
    {"up": up, "down": down}[action]()


if __name__ == "__main__":
    cli()
