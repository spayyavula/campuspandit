"""Polling helpers — boto3 waiters where they exist, custom polls where they don't."""
import time
import logging
from shared.config import SESSION, REGION

logger = logging.getLogger(__name__)


def wait_for_rds_available(instance_id: str) -> None:
    """Wait until an RDS instance reaches 'available' state."""
    logger.info("Waiting for RDS instance %s to become available ...", instance_id)
    rds = SESSION.client("rds")
    waiter = rds.get_waiter("db_instance_available")
    waiter.wait(
        DBInstanceIdentifier=instance_id,
        WaiterConfig={"Delay": 30, "MaxAttempts": 40},  # 20 min
    )
    logger.info("RDS instance %s is available.", instance_id)


def wait_for_rds_proxy_available(proxy_name: str, timeout_seconds: int = 300) -> None:
    """Poll until RDS Proxy reaches 'available' state (no boto3 waiter exists)."""
    logger.info("Waiting for RDS Proxy %s to become available ...", proxy_name)
    rds = SESSION.client("rds")
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        resp = rds.describe_db_proxies(DBProxyName=proxy_name)
        status = resp["DBProxies"][0]["Status"]
        if status == "available":
            logger.info("RDS Proxy %s is available.", proxy_name)
            return
        if status in ("incompatible-network", "insufficient-resource-limits"):
            raise RuntimeError(f"RDS Proxy {proxy_name} entered terminal state: {status}")
        logger.info("RDS Proxy status: %s — waiting ...", status)
        time.sleep(15)
    raise TimeoutError(f"RDS Proxy {proxy_name} did not become available within {timeout_seconds}s")


def wait_for_lambda_active(function_name: str) -> None:
    """Wait until a Lambda function is in Active state."""
    logger.info("Waiting for Lambda %s to become active ...", function_name)
    lmb = SESSION.client("lambda")
    waiter = lmb.get_waiter("function_active")
    waiter.wait(
        FunctionName=function_name,
        WaiterConfig={"Delay": 5, "MaxAttempts": 60},  # 5 min
    )
    logger.info("Lambda %s is active.", function_name)


def wait_for_acm_validated(cert_arn: str, timeout_seconds: int = 600) -> None:
    """Wait until an ACM certificate reaches ISSUED state."""
    logger.info("Waiting for ACM certificate to be issued: %s", cert_arn)
    acm = SESSION.client("acm", region_name=REGION)
    waiter = acm.get_waiter("certificate_validated")
    waiter.wait(
        CertificateArn=cert_arn,
        WaiterConfig={"Delay": 30, "MaxAttempts": 20},  # 10 min
    )
    logger.info("ACM certificate issued: %s", cert_arn)
