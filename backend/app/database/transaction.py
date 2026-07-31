from types import TracebackType
from typing import Optional, Type
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger


class DatabaseTransaction:
    """
    Context manager for atomic database transaction management.
    Supports automatic commits on success and automatic rollbacks on failure.
    """

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self._transaction = None

    async def __aenter__(self) -> AsyncSession:
        if not self.session.in_transaction():
            self._transaction = await self.session.begin()
        else:
            self._transaction = await self.session.begin_nested()
        return self.session

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        if exc_type is not None:
            logger.warning(f"Transaction failed due to {exc_type.__name__}: {exc_val}. Rolling back...")
            await self.session.rollback()
        else:
            try:
                await self.session.commit()
            except Exception as commit_exc:
                logger.error(f"Failed to commit transaction: {commit_exc}. Rolling back...")
                await self.session.rollback()
                raise commit_exc
