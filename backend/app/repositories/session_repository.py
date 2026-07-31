import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user_session import UserSession
from app.repositories.base_repository import BaseRepository


class SessionRepository(BaseRepository[UserSession]):
    """
    User Session Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(UserSession, session)

    async def get_active_sessions(self, user_id: uuid.UUID) -> List[UserSession]:
        """
        Fetch active session records for user.
        """
        query = (
            select(UserSession)
            .where(
                UserSession.user_id == user_id,
                UserSession.is_active == True,  # noqa: E712
                UserSession.expires_at > datetime.now(timezone.utc),
            )
            .order_by(UserSession.last_activity.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_by_token(self, refresh_token: str) -> Optional[UserSession]:
        """
        Fetch active user session matching refresh token string.
        """
        query = select(UserSession).where(
            UserSession.refresh_token == refresh_token,
            UserSession.is_active == True,  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def terminate_session(self, session_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """
        Deactivate a specific active session.
        """
        session_item = await self.get_by_id(session_id)
        if session_item and session_item.user_id == user_id:
            session_item.is_active = False
            self.session.add(session_item)
            await self.session.commit()
            return True
        return False

    async def terminate_all_sessions(self, user_id: uuid.UUID) -> int:
        """
        Deactivate all active sessions for a user (Logout all devices).
        """
        stmt = (
            update(UserSession)
            .where(UserSession.user_id == user_id, UserSession.is_active == True)  # noqa: E712
            .values(is_active=False)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount

    async def update_activity(self, session_id: uuid.UUID) -> None:
        """
        Update last_activity timestamp for a session.
        """
        stmt = (
            update(UserSession)
            .where(UserSession.id == session_id)
            .values(last_activity=datetime.now(timezone.utc))
        )
        await self.session.execute(stmt)
        await self.session.commit()
