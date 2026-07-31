import hashlib
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.refresh_token import RefreshToken
from app.repositories.base_repository import BaseRepository


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    """
    Refresh Token Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(RefreshToken, session)

    @staticmethod
    def hash_token(token_str: str) -> str:
        """Helper hashing token string via SHA-256."""
        return hashlib.sha256(token_str.encode("utf-8")).hexdigest()

    async def create_token(
        self, user_id: uuid.UUID, raw_token: str, expires_at: datetime, device_info: str = ""
    ) -> RefreshToken:
        """
        Store a hashed refresh token record.
        """
        token_hash = self.hash_token(raw_token)
        return await self.create(
            user_id=user_id,
            token_hash=token_hash,
            device_info=device_info,
            expires_at=expires_at,
            is_revoked=False,
        )

    async def get_valid_token(self, raw_token: str) -> Optional[RefreshToken]:
        """
        Find non-revoked and non-expired refresh token by raw token string.
        """
        token_hash = self.hash_token(raw_token)
        query = select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,  # noqa: E712
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def revoke_token(self, raw_token: str) -> bool:
        """
        Revoke a refresh token.
        """
        token_hash = self.hash_token(raw_token)
        query = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await self.session.execute(query)
        token_item = result.scalars().first()
        if token_item:
            token_item.is_revoked = True
            self.session.add(token_item)
            await self.session.commit()
            return True
        return False
