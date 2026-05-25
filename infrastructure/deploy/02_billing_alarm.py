"""02_billing_alarm.py — $200/mo CloudWatch billing alarm + SNS topic."""
import logging
import os

import click

from shared.config import SESSION, TAGS
from shared.idempotent import get_or_create, safe_delete
from shared import state

logger = logging.getLogger(__name__)

# CloudWatch billing metrics only exist in us-east-1
_US_EAST_1 = "us-east-1"
SNS_TOPIC_NAME = "campuspandit-billing-alerts"
ALARM_NAME = "campuspandit-monthly-bill-over-200"


def up() -> None:
    """Provision billing alarm. Idempotent."""
    email = os.environ.get("BILLING_ALERT_EMAIL")
    if not email:
        raise EnvironmentError(
            "BILLING_ALERT_EMAIL env var is required. "
            "Set it to the email address that should receive billing alerts."
        )

    sns = SESSION.client("sns", region_name=_US_EAST_1)
    cw = SESSION.client("cloudwatch", region_name=_US_EAST_1)

    # Create SNS topic (idempotent — returns existing ARN if already present)
    topic_arn = sns.create_topic(
        Name=SNS_TOPIC_NAME,
        Tags=TAGS,
    )["TopicArn"]
    logger.info("SNS topic: %s", topic_arn)

    # Subscribe email — idempotent (SNS deduplicates by endpoint)
    sns.subscribe(
        TopicArn=topic_arn,
        Protocol="email",
        Endpoint=email,
    )
    logger.info(
        "Subscribed %s to SNS topic. Check email and click the confirmation link.", email
    )

    # Create or update the CloudWatch alarm (put_metric_alarm is idempotent)
    cw.put_metric_alarm(
        AlarmName=ALARM_NAME,
        AlarmDescription="CampusPandit AWS monthly spend exceeded $200",
        Namespace="AWS/Billing",
        MetricName="EstimatedCharges",
        Dimensions=[{"Name": "Currency", "Value": "USD"}],
        Statistic="Maximum",
        Period=21600,        # 6 hours
        EvaluationPeriods=1,
        Threshold=200.0,
        ComparisonOperator="GreaterThanThreshold",
        AlarmActions=[topic_arn],
        TreatMissingData="notBreaching",
    )
    logger.info("CloudWatch alarm '%s' created/updated.", ALARM_NAME)

    state.set("/campuspandit/deploy/billing/sns_topic_arn", topic_arn)
    logger.info("02_billing_alarm: up complete.")


def down() -> None:
    """Tear down billing alarm. Idempotent."""
    cw = SESSION.client("cloudwatch", region_name=_US_EAST_1)
    sns = SESSION.client("sns", region_name=_US_EAST_1)

    # Delete alarm
    cw.delete_alarms(AlarmNames=[ALARM_NAME])
    logger.info("CloudWatch alarm '%s' deleted (no-op if absent).", ALARM_NAME)

    # Find and delete the SNS topic
    topic_arn = state.get("/campuspandit/deploy/billing/sns_topic_arn")
    if topic_arn:
        # Delete all subscriptions first
        paginator = sns.get_paginator("list_subscriptions_by_topic")
        for page in paginator.paginate(TopicArn=topic_arn):
            for sub in page["Subscriptions"]:
                if sub["SubscriptionArn"] not in ("PendingConfirmation", "Deleted"):
                    sns.unsubscribe(SubscriptionArn=sub["SubscriptionArn"])
        safe_delete(
            lambda: sns.delete_topic(TopicArn=topic_arn),
            sns.exceptions.NotFoundException,
        )
        logger.info("SNS topic deleted.")
    else:
        logger.info("No SNS topic ARN in SSM — skipping topic delete.")

    state.delete("/campuspandit/deploy/billing/sns_topic_arn")
    logger.info("02_billing_alarm: down complete.")


@click.command()
@click.argument("action", type=click.Choice(["up", "down"]))
def cli(action: str) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
    {"up": up, "down": down}[action]()


if __name__ == "__main__":
    cli()
