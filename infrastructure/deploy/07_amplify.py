"""07_amplify.py — Amplify app + branch + env vars."""
import logging
import os
from pathlib import Path

import click

from shared.config import SESSION, TAGS, AMPLIFY_APP_NAME
from shared.idempotent import safe_delete
from shared import state

logger = logging.getLogger(__name__)

amplify = SESSION.client("amplify")

GITHUB_REPO = "https://github.com/spayyavula/campuspandit"
BRANCH_NAME = "aws-platform"

_REPO_ROOT = Path(__file__).parent.parent.parent  # campuspandit/
_AMPLIFY_YML = _REPO_ROOT / "amplify.yml"


def _get_app_id() -> str | None:
    """Return Amplify app ID for campuspandit-observe, or None."""
    paginator = amplify.get_paginator("list_apps")
    for page in paginator.paginate():
        for app in page["apps"]:
            if app["name"] == AMPLIFY_APP_NAME:
                return app["appId"]
    return None


def up() -> None:
    """Provision Amplify app. Idempotent."""
    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        raise EnvironmentError(
            "GITHUB_TOKEN env var is required. "
            "Generate a GitHub personal access token (repo scope) and export it."
        )

    invoke_url = state.get("/campuspandit/deploy/api_gateway/invoke_url", "")

    # Read amplify.yml BuildSpec
    if _AMPLIFY_YML.exists():
        build_spec = _AMPLIFY_YML.read_text(encoding="utf-8")
        logger.info("Read BuildSpec from %s", _AMPLIFY_YML)
    else:
        # Minimal fallback — user should have amplify.yml committed
        logger.warning(
            "amplify.yml not found at %s — using minimal fallback BuildSpec. "
            "Commit amplify.yml to the repo root for full custom headers support.",
            _AMPLIFY_YML,
        )
        build_spec = (
            "version: 1\n"
            "frontend:\n"
            "  phases:\n"
            "    preBuild:\n"
            "      commands:\n"
            "        - npm ci\n"
            "    build:\n"
            "      commands:\n"
            "        - npm run build\n"
            "  artifacts:\n"
            "    baseDirectory: dist\n"
            "    files:\n"
            "      - '**/*'\n"
            "  cache:\n"
            "    paths:\n"
            "      - node_modules/**/*\n"
        )

    app_id = _get_app_id()
    if not app_id:
        logger.info("Creating Amplify app '%s' ...", AMPLIFY_APP_NAME)
        resp = amplify.create_app(
            name=AMPLIFY_APP_NAME,
            repository=GITHUB_REPO,
            accessToken=github_token,
            platform="WEB",
            buildSpec=build_spec,
            environmentVariables={"VITE_API_BASE_URL": invoke_url},
            tags={t["Key"]: t["Value"] for t in TAGS},
        )
        app_id = resp["app"]["appId"]
        default_domain = resp["app"]["defaultDomain"]
        logger.info("Amplify app created: %s (%s)", app_id, default_domain)
    else:
        logger.info("Amplify app already exists: %s — updating env vars ...", app_id)
        resp = amplify.update_app(
            appId=app_id,
            buildSpec=build_spec,
            environmentVariables={"VITE_API_BASE_URL": invoke_url},
        )
        default_domain = resp["app"]["defaultDomain"]

    state.set("/campuspandit/deploy/amplify/app_id", app_id)
    state.set("/campuspandit/deploy/amplify/default_domain", default_domain)

    # --- Create branch ---
    try:
        amplify.get_branch(appId=app_id, branchName=BRANCH_NAME)
        logger.info("Amplify branch '%s' already exists.", BRANCH_NAME)
    except amplify.exceptions.NotFoundException:
        amplify.create_branch(
            appId=app_id,
            branchName=BRANCH_NAME,
            enableAutoBuild=True,
            tags={t["Key"]: t["Value"] for t in TAGS},
        )
        logger.info("Amplify branch '%s' created.", BRANCH_NAME)

    logger.info(
        "Amplify app URL: https://%s.%s.amplifyapp.com", BRANCH_NAME, app_id
    )
    logger.info("07_amplify: up complete.")


def down() -> None:
    """Tear down Amplify app. Idempotent."""
    app_id = state.get("/campuspandit/deploy/amplify/app_id") or _get_app_id()
    if app_id:
        # Delete branch first
        safe_delete(
            lambda: amplify.delete_branch(appId=app_id, branchName=BRANCH_NAME),
            amplify.exceptions.NotFoundException,
        )
        logger.info("Amplify branch '%s' deleted (or already absent).", BRANCH_NAME)

        safe_delete(
            lambda: amplify.delete_app(appId=app_id),
            amplify.exceptions.NotFoundException,
        )
        logger.info("Amplify app %s deleted (or already absent).", app_id)
    else:
        logger.info("No Amplify app found — skipping.")

    for param in [
        "/campuspandit/deploy/amplify/app_id",
        "/campuspandit/deploy/amplify/default_domain",
    ]:
        state.delete(param)
    logger.info("07_amplify: down complete.")


@click.command()
@click.argument("action", type=click.Choice(["up", "down"]))
def cli(action: str) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
    {"up": up, "down": down}[action]()


if __name__ == "__main__":
    cli()
