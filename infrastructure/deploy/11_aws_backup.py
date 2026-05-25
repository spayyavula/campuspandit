"""11_aws_backup.py — AWS Backup vault + plan + RDS selection."""
import logging

import click

from shared.config import SESSION, ACCOUNT_ID, REGION, TAGS, BACKUP_VAULT_NAME, RDS_INSTANCE_ID
from shared.idempotent import safe_delete
from shared import state

logger = logging.getLogger(__name__)

backup = SESSION.client("backup")

PLAN_NAME = "daily-35-monthly-glacier-365"
SELECTION_NAME = "campuspandit-prod-rds"
DEFAULT_BACKUP_ROLE = (
    f"arn:aws:iam::{ACCOUNT_ID}:role/service-role/AWSBackupDefaultServiceRole"
)


def _get_vault_arn() -> str | None:
    try:
        resp = backup.describe_backup_vault(BackupVaultName=BACKUP_VAULT_NAME)
        return resp["BackupVaultArn"]
    except backup.exceptions.ResourceNotFoundException:
        return None


def _get_plan_id() -> str | None:
    paginator = backup.get_paginator("list_backup_plans")
    for page in paginator.paginate():
        for plan in page.get("BackupPlansList", []):
            if plan["BackupPlanName"] == PLAN_NAME:
                return plan["BackupPlanId"]
    return None


def up() -> None:
    """Provision AWS Backup vault + plan + RDS selection. Idempotent."""
    # --- Backup vault ---
    vault_arn = _get_vault_arn()
    if not vault_arn:
        logger.info("Creating backup vault '%s' ...", BACKUP_VAULT_NAME)
        resp = backup.create_backup_vault(
            BackupVaultName=BACKUP_VAULT_NAME,
            BackupVaultTags={t["Key"]: t["Value"] for t in TAGS},
        )
        vault_arn = resp["BackupVaultArn"]
        logger.info("Backup vault created: %s", vault_arn)
    else:
        logger.info("Backup vault already exists: %s", vault_arn)

    state.set("/campuspandit/deploy/backup/vault_arn", vault_arn)

    # --- Backup plan ---
    plan_id = _get_plan_id()
    if not plan_id:
        logger.info("Creating backup plan '%s' ...", PLAN_NAME)
        resp = backup.create_backup_plan(
            BackupPlan={
                "BackupPlanName": PLAN_NAME,
                "Rules": [
                    {
                        "RuleName": "daily-35",
                        "TargetBackupVaultName": BACKUP_VAULT_NAME,
                        "ScheduleExpression": "cron(0 2 * * ? *)",  # 02:00 UTC daily
                        "Lifecycle": {"DeleteAfterDays": 35},
                    },
                    {
                        "RuleName": "monthly-glacier-365",
                        "TargetBackupVaultName": BACKUP_VAULT_NAME,
                        "ScheduleExpression": "cron(0 3 1 * ? *)",  # 03:00 UTC 1st of month
                        "Lifecycle": {
                            "MoveToColdStorageAfterDays": 1,
                            "DeleteAfterDays": 365,
                        },
                    },
                ],
            },
            BackupPlanTags={t["Key"]: t["Value"] for t in TAGS},
        )
        plan_id = resp["BackupPlanId"]
        logger.info("Backup plan created: %s", plan_id)
    else:
        logger.info("Backup plan already exists: %s", plan_id)

    state.set("/campuspandit/deploy/backup/plan_id", plan_id)

    # --- Verify AWSBackupDefaultServiceRole exists ---
    iam = SESSION.client("iam")
    try:
        iam.get_role(RoleName="AWSBackupDefaultServiceRole")
    except iam.exceptions.NoSuchEntityException:
        raise RuntimeError(
            "AWSBackupDefaultServiceRole does not exist in this account. "
            "Go to AWS Backup console and create one backup manually — "
            "this will auto-create the role, then re-run this script."
        )

    # --- Resource selection ---
    # Check if a selection already exists for this plan
    existing_selections = backup.list_backup_selections(BackupPlanId=plan_id).get(
        "BackupSelectionsList", []
    )
    selection_exists = any(
        s["SelectionName"] == SELECTION_NAME for s in existing_selections
    )

    if not selection_exists:
        rds_arn = (
            f"arn:aws:rds:{REGION}:{ACCOUNT_ID}:db:{RDS_INSTANCE_ID}"
        )
        backup.create_backup_selection(
            BackupPlanId=plan_id,
            BackupSelection={
                "SelectionName": SELECTION_NAME,
                "IamRoleArn": DEFAULT_BACKUP_ROLE,
                "Resources": [rds_arn],
            },
        )
        logger.info("Backup selection created: %s -> %s", SELECTION_NAME, rds_arn)
    else:
        logger.info("Backup selection already exists for plan %s.", plan_id)

    logger.info("11_aws_backup: up complete.")


def down() -> None:
    """Tear down AWS Backup selection, plan, vault. Idempotent."""
    plan_id = state.get("/campuspandit/deploy/backup/plan_id") or _get_plan_id()

    if plan_id:
        # Delete selection(s)
        try:
            selections = backup.list_backup_selections(BackupPlanId=plan_id).get(
                "BackupSelectionsList", []
            )
            for sel in selections:
                backup.delete_backup_selection(
                    BackupPlanId=plan_id,
                    SelectionId=sel["SelectionId"],
                )
                logger.info("Deleted backup selection %s.", sel["SelectionName"])
        except backup.exceptions.ResourceNotFoundException:
            pass

        safe_delete(
            lambda: backup.delete_backup_plan(BackupPlanId=plan_id),
            backup.exceptions.ResourceNotFoundException,
        )
        logger.info("Backup plan deleted (or already absent).")

    # Delete vault (only if empty — AWS refuses to delete a non-empty vault)
    vault_arn = state.get("/campuspandit/deploy/backup/vault_arn")
    if vault_arn:
        try:
            recovery_points = backup.list_recovery_points_by_backup_vault(
                BackupVaultName=BACKUP_VAULT_NAME
            ).get("RecoveryPoints", [])
            if recovery_points:
                logger.warning(
                    "Backup vault '%s' contains %d recovery points — "
                    "cannot delete non-empty vault. Delete recovery points manually first.",
                    BACKUP_VAULT_NAME, len(recovery_points),
                )
            else:
                safe_delete(
                    lambda: backup.delete_backup_vault(BackupVaultName=BACKUP_VAULT_NAME),
                    backup.exceptions.ResourceNotFoundException,
                )
                logger.info("Backup vault deleted (or already absent).")
        except backup.exceptions.ResourceNotFoundException:
            pass

    for param in [
        "/campuspandit/deploy/backup/plan_id",
        "/campuspandit/deploy/backup/vault_arn",
    ]:
        state.delete(param)
    logger.info("11_aws_backup: down complete.")


@click.command()
@click.argument("action", type=click.Choice(["up", "down"]))
def cli(action: str) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
    {"up": up, "down": down}[action]()


if __name__ == "__main__":
    cli()
