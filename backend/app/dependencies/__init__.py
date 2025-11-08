"""
FastAPI Dependencies
"""

from app.dependencies.auth import (
    get_current_user,
    get_current_active_user,
    get_current_verified_user,
    get_optional_user,
    require_role,
    require_admin,
    require_tutor,
    require_student,
)

__all__ = [
    "get_current_user",
    "get_current_active_user",
    "get_current_verified_user",
    "get_optional_user",
    "require_role",
    "require_admin",
    "require_tutor",
    "require_student",
]
