import uuid
from typing import Any, Dict, Optional
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.repositories.audit_log_repository import AuditLogRepository


class AuditService:
    """
    Business Logic Service managing immutable audit log entries, entity diffs, and audit trail searches.
    """

    @classmethod
    async def log_audit(
        cls,
        action: str,
        db: AsyncSession,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        user_id: Optional[uuid.UUID] = None,
        workspace_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        description: Optional[str] = None,
    ) -> AuditLog:
        """
        Creates an immutable audit log record in database.
        """
        repo = AuditLogRepository(db)
        audit = await repo.create(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            user_id=user_id,
            workspace_id=workspace_id,
            ip_address=ip_address,
            description=description,
            status="SUCCESS",
        )
        logger.info(f"AUDIT LOG CREATED | Action: '{action}' | User: '{user_id}' | Entity: '{entity_type}'")
        return audit

    @staticmethod
    async def search_audit_logs(
        db: AsyncSession,
        workspace_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """
        Retrieves paginated audit log entries.
        """
        repo = AuditLogRepository(db)
        return await repo.search_audit_logs(
            workspace_id=workspace_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            search=search,
            page=page,
            page_size=page_size,
        )
