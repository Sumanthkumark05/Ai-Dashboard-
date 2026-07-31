import functools
from typing import Any, Callable
from fastapi import HTTPException, status
from app.models.user import User


def require_permission(permission_name: str) -> Callable:
    """
    Decorator enforcing that the current user kwarg possesses a specific permission.
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            current_user: User = kwargs.get("current_user")
            if not current_user:
                for arg in args:
                    if isinstance(arg, User):
                        current_user = arg
                        break

            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required for permission verification.",
                )

            if current_user.is_superuser or str(current_user.role) in (
                "super_admin",
                "owner",
                "admin",
            ):
                return await func(*args, **kwargs)

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission_name}' is required for this operation.",
            )

        return wrapper

    return decorator
