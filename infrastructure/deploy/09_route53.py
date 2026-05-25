"""09_route53.py — Route 53 hosted zone for campuspandit.ai (no records yet)."""
import logging

import click

from shared.config import SESSION, TAGS, DOMAIN
from shared.idempotent import safe_delete
from shared import state

logger = logging.getLogger(__name__)

r53 = SESSION.client("route53")


def _get_hosted_zone_id() -> str | None:
    """Return the hosted zone ID for campuspandit.ai, or None."""
    resp = r53.list_hosted_zones_by_name(DNSName=DOMAIN, MaxItems="1")
    for zone in resp.get("HostedZones", []):
        # Normalize: zone Name has a trailing dot
        if zone["Name"].rstrip(".") == DOMAIN:
            return zone["Id"].split("/")[-1]
    return None


def up() -> None:
    """Provision Route 53 hosted zone. Idempotent."""
    zone_id = _get_hosted_zone_id()
    if not zone_id:
        logger.info("Creating hosted zone for %s ...", DOMAIN)
        import time
        resp = r53.create_hosted_zone(
            Name=DOMAIN,
            CallerReference=str(int(time.time())),
            HostedZoneConfig={
                "Comment": "CampusPandit production zone - managed by boto3-deploy",
                "PrivateZone": False,
            },
        )
        zone_id = resp["HostedZone"]["Id"].split("/")[-1]
        logger.info("Hosted zone created: %s", zone_id)
    else:
        logger.info("Hosted zone already exists: %s", zone_id)

    state.set("/campuspandit/deploy/route53/zone_id", zone_id)

    # Capture NS records so the user can update their registrar
    rrsets = r53.list_resource_record_sets(
        HostedZoneId=zone_id,
        StartRecordType="NS",
        MaxItems="1",
    )
    ns_values: list[str] = []
    for rrset in rrsets.get("ResourceRecordSets", []):
        if rrset["Type"] == "NS":
            ns_values = [r["Value"].rstrip(".") for r in rrset["ResourceRecords"]]
            break

    ns_string = ",".join(ns_values)
    state.set("/campuspandit/deploy/route53/name_servers", ns_string)
    logger.info(
        "Route 53 nameservers (update your registrar to point to these):\n  %s",
        "\n  ".join(ns_values),
    )
    logger.info(
        "NOTE: Do NOT update registrar nameservers yet — "
        "that is Phase 5 step 4 (after ACM cert is issued and smoke test passes)."
    )
    logger.info("09_route53: up complete.")


def down() -> None:
    """Tear down Route 53 hosted zone. Idempotent."""
    zone_id = state.get("/campuspandit/deploy/route53/zone_id") or _get_hosted_zone_id()
    if not zone_id:
        logger.info("No hosted zone found — skipping.")
    else:
        # Delete all non-NS and non-SOA records before deleting the zone
        paginator = r53.get_paginator("list_resource_record_sets")
        changes = []
        for page in paginator.paginate(HostedZoneId=zone_id):
            for rrset in page["ResourceRecordSets"]:
                if rrset["Type"] not in ("NS", "SOA"):
                    changes.append({"Action": "DELETE", "ResourceRecordSet": rrset})

        if changes:
            r53.change_resource_record_sets(
                HostedZoneId=zone_id,
                ChangeBatch={"Changes": changes},
            )
            logger.info("Deleted %d non-NS/SOA records from zone %s.", len(changes), zone_id)

        safe_delete(
            lambda: r53.delete_hosted_zone(Id=zone_id),
            r53.exceptions.NoSuchHostedZone,
        )
        logger.info("Hosted zone %s deleted (or already absent).", zone_id)

    for param in [
        "/campuspandit/deploy/route53/zone_id",
        "/campuspandit/deploy/route53/name_servers",
    ]:
        state.delete(param)
    logger.info("09_route53: down complete.")


@click.command()
@click.argument("action", type=click.Choice(["up", "down"]))
def cli(action: str) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
    {"up": up, "down": down}[action]()


if __name__ == "__main__":
    cli()
