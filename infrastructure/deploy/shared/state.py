"""SSM Parameter Store read/write for inter-script state sharing."""
import logging
from typing import Optional
from shared.config import SESSION

logger = logging.getLogger(__name__)

_ssm = SESSION.client("ssm")


def get(name: str, default: Optional[str] = None) -> Optional[str]:
    """Read a parameter from SSM. Returns default if it does not exist."""
    try:
        resp = _ssm.get_parameter(Name=name, WithDecryption=True)
        return resp["Parameter"]["Value"]
    except _ssm.exceptions.ParameterNotFound:
        return default


def set(name: str, value: str, secure: bool = False) -> None:
    """Write (or overwrite) a parameter in SSM Parameter Store."""
    param_type = "SecureString" if secure else "String"
    _ssm.put_parameter(
        Name=name,
        Value=value,
        Type=param_type,
        Overwrite=True,
    )
    logger.info("SSM set %s", name)


def delete(name: str) -> None:
    """Delete a parameter from SSM. Silent if it does not exist."""
    try:
        _ssm.delete_parameter(Name=name)
        logger.info("SSM deleted %s", name)
    except _ssm.exceptions.ParameterNotFound:
        logger.debug("SSM param %s already absent.", name)
