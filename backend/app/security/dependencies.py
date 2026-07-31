import uuid
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import UserRole
from app.database.dependency import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.security.jwt import decode_token

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_PREFIX}/auth/login",
    scheme_name="JWT OAuth2 Bearer",
)


async def get_current_user(
    token: str = Depends(reusable_oauth2),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency decoding the bearer JWT token and loading the current User instance.
    Validates token expiration, user existence, and active account status.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)
    token_type: Optional[str] = payload.get("type")
    user_id_str: Optional[str] = payload.get("sub")

    if token_type != "access" or not user_id_str:
        raise credentials_exception

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    repo = UserRepository(db)
    user = await repo.get_by_id(user_uuid)

    if not user:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )

    return user


async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency restricting endpoint access to Superusers or Admin roles only.
    """
    if not (current_user.is_superuser or current_user.role in (UserRole.ADMIN, UserRole.OWNER)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires administrator privileges.",
        )
    return current_user
