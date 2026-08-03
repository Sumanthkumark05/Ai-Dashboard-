from fastapi import Depends, HTTPException, status
from app.models.user import User
from app.security.dependencies import get_current_user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Security dependency enforcing administrator access control (SUPER_ADMIN or SYSTEM_ADMIN).
    """
    user_role_name = ""
    if current_user.role:
        user_role_name = current_user.role.name.upper()

    if (
        user_role_name not in ["SUPER_ADMIN", "SYSTEM_ADMIN", "ADMIN"]
        and not getattr(current_user, "is_superuser", False)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )
    return current_user
