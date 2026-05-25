"""10_acm.py — ACM certificate request + Route 53 DNS validation."""
import logging
import time

import click

from shared.config import SESSION, REGION, DOMAIN, SUBDOMAIN
from shared.idempotent import safe_delete
from shared.waits import wait_for_acm_validated
from shared import state

logger = logging.getLogger(__name__)

acm = SESSION.client("acm", region_name=REGION)
r53 = SESSION.client("route53")


def _get_cert_arn() -> str | None:
    """Return the ARN of an existing cert for www.campuspandit.ai, or None."""
    paginator = acm.get_paginator("list_certificates")
    for page in paginator.paginate(CertificateStatuses=["PENDING_VALIDATION", "ISSUED"]):
        for cert in page["CertificateSummaryList"]:
            if cert.get("DomainName") in (DOMAIN, SUBDOMAIN):
                return cert["CertificateArn"]
    return None


def up() -> None:
    """Request ACM cert + DNS-validate via Route 53. Idempotent."""
    zone_id = state.get("/campuspandit/deploy/route53/zone_id")
    if not zone_id:
        raise RuntimeError("Route 53 zone ID not found. Run 09_route53.py up first.")

    cert_arn = state.get("/campuspandit/deploy/acm/cert_arn") or _get_cert_arn()
    if not cert_arn:
        logger.info("Requesting ACM certificate for %s + %s ...", DOMAIN, SUBDOMAIN)
        resp = acm.request_certificate(
            DomainName=DOMAIN,
            SubjectAlternativeNames=[SUBDOMAIN],
            ValidationMethod="DNS",
            KeyAlgorithm="RSA_2048",
        )
        cert_arn = resp["CertificateArn"]
        logger.info("Certificate requested: %s", cert_arn)

        # Brief wait for validation records to populate on the cert detail
        logger.info("Waiting 15s for DNS validation records to populate ...")
        time.sleep(15)
    else:
        logger.info("ACM certificate already exists: %s", cert_arn)

    state.set("/campuspandit/deploy/acm/cert_arn", cert_arn)

    # --- Create DNS validation CNAME records in Route 53 ---
    cert_detail = acm.describe_certificate(CertificateArn=cert_arn)["Certificate"]
    validation_options = cert_detail.get("DomainValidationOptions", [])

    changes = []
    for opt in validation_options:
        record = opt.get("ResourceRecord")
        if not record:
            logger.warning(
                "Validation record for %s not yet available — re-run this script in 30s.",
                opt.get("DomainName"),
            )
            continue
        # Check if record already exists
        existing = r53.list_resource_record_sets(
            HostedZoneId=zone_id,
            StartRecordName=record["Name"],
            StartRecordType="CNAME",
            MaxItems="1",
        )
        already_exists = any(
            r["Name"].rstrip(".") == record["Name"].rstrip(".")
            for r in existing.get("ResourceRecordSets", [])
            if r["Type"] == "CNAME"
        )
        if not already_exists:
            changes.append({
                "Action": "UPSERT",
                "ResourceRecordSet": {
                    "Name": record["Name"],
                    "Type": "CNAME",
                    "TTL": 300,
                    "ResourceRecords": [{"Value": record["Value"]}],
                },
            })
            logger.info("Adding validation CNAME: %s -> %s", record["Name"], record["Value"])
        else:
            logger.info("Validation CNAME already exists for %s.", opt.get("DomainName"))

    if changes:
        r53.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch={
                "Comment": "ACM DNS validation records",
                "Changes": changes,
            },
        )
        logger.info("DNS validation CNAMEs created in Route 53.")

    logger.info("Waiting for certificate validation (can take up to 10 min) ...")
    wait_for_acm_validated(cert_arn)
    logger.info("Certificate issued: %s", cert_arn)
    logger.info("10_acm: up complete.")


def down() -> None:
    """Delete ACM cert + its validation CNAMEs from Route 53. Idempotent."""
    cert_arn = state.get("/campuspandit/deploy/acm/cert_arn") or _get_cert_arn()
    zone_id = state.get("/campuspandit/deploy/route53/zone_id")

    if cert_arn and zone_id:
        # Remove validation CNAMEs
        try:
            cert_detail = acm.describe_certificate(CertificateArn=cert_arn)["Certificate"]
            changes = []
            for opt in cert_detail.get("DomainValidationOptions", []):
                record = opt.get("ResourceRecord")
                if record:
                    changes.append({
                        "Action": "DELETE",
                        "ResourceRecordSet": {
                            "Name": record["Name"],
                            "Type": "CNAME",
                            "TTL": 300,
                            "ResourceRecords": [{"Value": record["Value"]}],
                        },
                    })
            if changes:
                safe_delete(
                    lambda: r53.change_resource_record_sets(
                        HostedZoneId=zone_id,
                        ChangeBatch={"Changes": changes},
                    ),
                    r53.exceptions.InvalidChangeBatch,
                )
                logger.info("Deleted %d validation CNAME(s) from Route 53.", len(changes))
        except acm.exceptions.ResourceNotFoundException:
            pass

    if cert_arn:
        safe_delete(
            lambda: acm.delete_certificate(CertificateArn=cert_arn),
            acm.exceptions.ResourceNotFoundException,
        )
        logger.info("ACM certificate deleted (or already absent).")

    state.delete("/campuspandit/deploy/acm/cert_arn")
    logger.info("10_acm: down complete.")


@click.command()
@click.argument("action", type=click.Choice(["up", "down"]))
def cli(action: str) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
    {"up": up, "down": down}[action]()


if __name__ == "__main__":
    cli()
