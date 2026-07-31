import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    """
    User Data Access Repository extending generic BaseRepository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Fetch active non-deleted user by unique email address.
        """
        query = select(User).where(
            User.email == email.lower(), User.is_deleted == False  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_username(self, username: str) -> Optional[User]:
        """
        Fetch active non-deleted user by unique username.
        """
        query = select(User).where(
            User.username == username.lower(), User.is_deleted == False  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_by_email_or_username(self, identifier: str) -> Optional[User]:
        """
        Fetch active non-deleted user by email or username matching identifier.
        """
        clean_identifier = identifier.lower().strip()
        query = select(User).where(
            or_(
                User.email == clean_identifier,
                User.username == clean_identifier,
            ),
            User.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def update_last_login(self, user_id: uuid.UUID) -> None:
        """
        Update last_login timestamp for a user.
        """
        user = await self.get_by_id(user_id)
        if user:
            user.last_login = datetime.now(timezone.utc)
            self.session.add(user)
            await self.session.commit()
