from datetime import datetime, timedelta, timezone
from typing import Dict
from loguru import logger
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity
from app.models.audit_log import AuditLog
from app.models.security_event import SecurityEvent


class RetentionService:
    """
    Service enforcing data retention policies (365 days AuditLogs, 180 days Activity, 730 days SecurityEvents).
    """

    AUDIT_LOG_RETENTION_DAYS = 365
    ACTIVITY_RETENTION_DAYS = 180
    SECURITY_EVENT_RETENTION_DAYS = 730

    @classmethod
    async def purge_expired_records(cls, db: AsyncSession) -> Dict[str, int]:
        """
        Deletes database records exceeding retention windows.
        """
        now = datetime.now(timezone.utc)

        # 1. Purge AuditLogs older than 365 days
        audit_threshold = now - timedelta(days=cls.AUDIT_LOG_RETENTION_DAYS)
        audit_stmt = delete(AuditLog).where(AuditLog.created_at < audit_threshold)
        audit_res = await db.execute(audit_stmt)
        audit_purged = audit_res.rowcount or 0

        # 2. Purge Activity older than 180 days
        activity_threshold = now - timedelta(days=cls.ACTIVITY_RETENTION_DAYS)
        activity_stmt = delete(Activity).where(Activity.created_at < activity_threshold)
        activity_res = await db.execute(activity_stmt)
        activity_purged = activity_res.rowcount or 0

        # 3. Purge SecurityEvents older than 730 days
        sec_threshold = now - timedelta(days=cls.SECURITY_EVENT_RETENTION_DAYS)
        sec_stmt = delete(SecurityEvent).where(SecurityEvent.created_at < sec_threshold)
        sec_res = await db.execute(sec_stmt)
        sec_purged = sec_res.rowcount or 0

        await db.commit()

        logger.info(
            f"Retention Purge Completed | AuditLogs: {audit_purged} | Activities: {activity_purged} | SecurityEvents: {sec_purged}"
        )
        return {
            "audit_logs_purged": audit_purged,
            "activities_purged": activity_purged,
            "security_events_purged": sec_purged,
        }
