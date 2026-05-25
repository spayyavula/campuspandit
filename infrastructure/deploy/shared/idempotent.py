"""Idempotent get-or-create and safe-delete helpers."""
import logging
from typing import Any, Callable, Tuple, Type

logger = logging.getLogger(__name__)


def get_or_create(
    get_fn: Callable[[], Any],
    create_fn: Callable[[], Any],
    *exception_types: Type[Exception],
) -> Any:
    """Call get_fn first; if it raises one of exception_types (or returns None),
    call create_fn instead and return its result.

    Usage::

        result = get_or_create(
            lambda: iam.get_user(UserName="campuspandit-ci")["User"],
            lambda: iam.create_user(UserName="campuspandit-ci")["User"],
            iam.exceptions.NoSuchEntityException,
        )
    """
    try:
        result = get_fn()
        if result is not None:
            return result
        return create_fn()
    except tuple(exception_types):
        return create_fn()


def safe_delete(
    delete_fn: Callable[[], Any],
    *exception_types: Type[Exception],
) -> None:
    """Call delete_fn; silently swallow any of the given exception types
    (e.g. ResourceNotFoundException when the resource is already gone).

    Usage::

        safe_delete(
            lambda: iam.delete_user(UserName="campuspandit-ci"),
            iam.exceptions.NoSuchEntityException,
        )
    """
    try:
        delete_fn()
    except tuple(exception_types):
        logger.debug("Resource already absent — skipping delete.")
