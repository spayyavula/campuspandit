"""teardown.py — Inverse of deploy.py; tears down all AWS resources.

Usage:
    python teardown.py down --force     # skip confirmation prompts + final RDS snapshot
    python teardown.py down             # interactive confirmation required
"""
import importlib.util
import logging
import sys
from pathlib import Path
from typing import Callable

import click

# Reverse of deploy.py's _SCRIPT_ORDER
_TEARDOWN_ORDER = [
    "11_aws_backup",
    "10_acm",
    "09_route53",
    "08_cognito",
    "07_amplify",
    "05_api_gateway",
    "06_lambdas",
    "04_rds_proxy",
    "03_rds",
    "02_billing_alarm",
    "01_iam",
]

_DEPLOY_DIR = Path(__file__).parent

# Allow down() scripts to read this flag via environment
_FORCE_FLAG_ENV = "CAMPUSPANDIT_TEARDOWN_FORCE"


def _load_module(script_name: str):
    path = _DEPLOY_DIR / f"{script_name}.py"
    if not path.exists():
        raise FileNotFoundError(f"Script not found: {path}")
    spec = importlib.util.spec_from_file_location(script_name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _run_down(script_names: list[str]) -> None:
    for name in script_names:
        logger = logging.getLogger(name)
        logger.info(">>> %s DOWN", name)
        try:
            mod = _load_module(name)
            fn: Callable = getattr(mod, "down")
            fn()
        except Exception:
            logger.exception("FAILED: %s down", name)
            raise


@click.command()
@click.argument("action", type=click.Choice(["down"]))
@click.option(
    "--force",
    is_flag=True,
    default=False,
    help=(
        "Skip confirmation prompt and skip RDS final snapshot. "
        "WARNING: this is destructive and irreversible."
    ),
)
@click.option(
    "--scripts",
    default="all",
    help="Comma-separated script names or 'all'.",
)
def cli(action: str, force: bool, scripts: str) -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(message)s",
        stream=sys.stdout,
    )

    if not force:
        click.echo(
            "\n"
            "WARNING: This will DELETE all CampusPandit AWS resources including RDS.\n"
            "Data loss is permanent. Make sure you have a recent snapshot or backup.\n"
            "\nTo skip this prompt, pass --force.\n"
        )
        confirmed = click.confirm("Type YES to confirm teardown", default=False)
        if not confirmed:
            click.echo("Teardown cancelled.")
            sys.exit(0)

    if scripts == "all":
        script_names = _TEARDOWN_ORDER
    else:
        script_names = [s.strip() for s in scripts.split(",") if s.strip()]

    # Signal to 03_rds.down() that it should skip final snapshot
    if force:
        import os
        os.environ[_FORCE_FLAG_ENV] = "1"

    logging.getLogger(__name__).info(
        "Running teardown for: %s", ", ".join(script_names)
    )
    _run_down(script_names)
    logging.getLogger(__name__).info("Teardown complete.")


if __name__ == "__main__":
    cli()
