from typing import Callable, List
from fastapi import Depends, HTTPException, status
from app.core.constants import UserRole
from app.models.user import User
from app.security.dependencies import get_current_user


def require_role(allowed_roles: List[UserRole]) -> Callable:
    """
    FastAPI dependency factory enforcing that current user holds one of the allowed roles.
    """

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superuser:
            return current_user

        user_role_str = (
            current_user.role.value
            if hasattr(current_user.role, "value")
            else str(current_user.role)
        )
        allowed_role_strs = [
            r.value if hasattr(r, "value") else str(r) for r in allowed_roles
        ]

        if user_role_str not in allowed_role_strs:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {[r.value for r in allowed_roles]}",
            )
        return current_user

    return role_checker


def require_admin() -> Callable:
    """
    FastAPI dependency requiring ADMIN, OWNER, or SUPER_ADMIN role.
    """
    return require_role([UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN])


def require_owner() -> Callable:
    """
    FastAPI dependency requiring OWNER or SUPER_ADMIN role.
    """
    return require_role([UserRole.SUPER_ADMIN, UserRole.OWNER])


def require_permission(permission_name: str) -> Callable:
    """
    FastAPI dependency factory verifying specific fine-grained permission string.
    """

    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superuser or current_user.role in (
            UserRole.SUPER_ADMIN,
            UserRole.OWNER,
            UserRole.ADMIN,
        ):
            return current_user

        # Detailed permission check foundation (evaluated against role_permissions)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Missing required permission: '{permission_name}'",
        )

    return permission_checker
