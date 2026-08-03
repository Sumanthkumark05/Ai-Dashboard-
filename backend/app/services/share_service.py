import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file_share import FileShare
from app.models.stored_file import StoredFile
from app.models.user import User
from app.repositories.file_share_repository import FileShareRepository
from app.repositories.stored_file_repository import StoredFileRepository


class ShareService:
    """
    Business Logic Service managing secure, tokenized file sharing.
    """

    @staticmethod
    async def create_share_link(
        file: StoredFile,
        expires_in_days: Optional[int],
        user: User,
        db: AsyncSession,
    ) -> FileShare:
        """
        Generates a public share link token for a file.
        """
        share_repo = FileShareRepository(db)
        token = uuid.uuid4().hex

        expires_at = None
        if expires_in_days:
            expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)

        share = await share_repo.create(
            file_id=file.id,
            token=token,
            expires_at=expires_at,
            is_active=True,
            created_by=user.id,
        )
        await db.commit()
        await db.refresh(share)

        logger.info(f"Share link created for File ID {file.id} with Token '{token}'")
        return share

    @staticmethod
    async def get_file_by_share_token(
        token: str, db: AsyncSession
    ) -> StoredFile:
        """
        Validates share token and returns associated StoredFile.
        """
        share_repo = FileShareRepository(db)
        share = await share_repo.get_by_token(token)

        if not share or not share.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Share link token not found or revoked.",
            )

        if share.expires_at:
            now = datetime.now(timezone.utc)
            expires_at = share.expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)

            if expires_at < now:
                share.is_active = False
                db.add(share)
                await db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Share link has expired.",
                )

        file_repo = StoredFileRepository(db)
        file = await file_repo.get_by_id(share.file_id)
        if not file or file.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shared file not found.",
            )

        return file

    @staticmethod
    async def revoke_share_link(token: str, db: AsyncSession) -> bool:
        """
        Revokes a public share link token.
        """
        share_repo = FileShareRepository(db)
        share = await share_repo.get_by_token(token)
        if not share:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Share link token not found.",
            )

        share.is_active = False
        db.add(share)
        await db.commit()
        logger.info(f"Share link token '{token}' revoked.")
        return True
