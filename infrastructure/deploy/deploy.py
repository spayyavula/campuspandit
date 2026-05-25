"""deploy.py — Orchestrator entrypoint for CampusPandit AWS provisioning.

Usage:
    python deploy.py up               # provision all resources
    python deploy.py down             # tear down all resources (reverse order)
    python deploy.py status           # print all SSM /campuspandit/deploy/* params
    python deploy.py up --scripts 03_rds,04_rds_proxy   # run specific scripts only
"""
import importlib.util
import logging
import sys
from pathlib import Path
from typing import Callable

import click

# Execution order for 'up'. 'down' uses the reverse.
# Note: 06 (lambdas) runs before 05 (api_gateway) because routes depend on Lambda ARNs.
_SCRIPT_ORDER = [
    "01_iam",
    "02_billing_alarm",
    "03_rds",
    "04_rds_proxy",
    "06_lambdas",
    "05_api_gateway",
    "07_amplify",
    "08_cognito",
    "09_route53",
    "10_acm",
    "11_aws_backup",
]

_DEPLOY_DIR = Path(__file__).parent


def _load_module(script_name: str):
    """Dynamically load a deploy script module by name (e.g. '01_iam')."""
    path = _DEPLOY_DIR / f"{script_name}.py"
    if not path.exists():
        raise FileNotFoundError(f"Script not found: {path}")
    spec = importlib.util.spec_from_file_location(script_name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _run_scripts(script_names: list[str], action: str) -> None:
    """Load and run up() or down() for each script in order."""
    for name in script_names:
        logger = logging.getLogger(name)
        logger.info(">>> %s %s", name, action.upper())
        try:
            mod = _load_module(name)
            fn: Callable = getattr(mod, action)
            fn()
        except Exception:
            logger.exception("FAILED: %s %s", name, action)
            raise


def _status() -> None:
    """Print all SSM parameters under /campuspandit/deploy/ as a table."""
    # Import state lazily so we can run `deploy.py status` without all scripts loaded
    from shared import state as st
    from shared.config import SESSION

    ssm = SESSION.client("ssm")
    paginator = ssm.get_paginator("get_parameters_by_path")
    rows = []
    for page in paginator.paginate(
        Path="/campuspandit/deploy/",
        Recursive=True,
        WithDecryption=False,
    ):
        for param in page["Parameters"]:
            rows.append((param["Name"], param["Value"]))

    if not rows:
        print("No parameters found under /campuspandit/deploy/ — run 'deploy.py up' first.")
        return

    max_name = max(len(r[0]) for r in rows)
    print(f"\n{'PARAMETER':<{max_name}}  VALUE")
    print("-" * (max_name + 60))
    for name, value in sorted(rows):
        print(f"{name:<{max_name}}  {value}")
    print()


@click.command()
@click.argument("action", type=click.Choice(["up", "down", "status"]))
@click.option(
    "--scripts",
    default="all",
    help=(
        "Comma-separated list of script names to run (e.g. '03_rds,04_rds_proxy') "
        "or 'all' (default). Names must match files without .py extension."
    ),
)
def cli(action: str, scripts: str) -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(message)s",
        stream=sys.stdout,
    )

    if action == "status":
        _status()
        return

    if scripts == "all":
        script_names = _SCRIPT_ORDER
    else:
        script_names = [s.strip() for s in scripts.split(",") if s.strip()]
        # Validate all names exist
        for name in script_names:
            path = _DEPLOY_DIR / f"{name}.py"
            if not path.exists():
                raise click.ClickException(f"Script not found: {name}.py")

    if action == "down":
        # Reverse order for teardown
        script_names = list(reversed(script_names))

    logging.getLogger(__name__).info(
        "Running '%s' for scripts: %s", action, ", ".join(script_names)
    )
    _run_scripts(script_names, action)
    logging.getLogger(__name__).info("All scripts completed successfully.")


if __name__ == "__main__":
    cli()
