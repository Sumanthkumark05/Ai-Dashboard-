import uuid
from typing import Any, Dict, Optional
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity
from app.models.audit_log import AuditLog
from app.models.background_job import BackgroundJob
from app.models.dataset import Dataset
from app.models.document import Document
from app.models.organization import Organization
from app.models.security_event import SecurityEvent
from app.models.stored_file import StoredFile
from app.models.team import Team
from app.models.user import User
from app.models.user_session import UserSession
from app.models.workspace import Workspace
from app.schemas.admin import AdminDashboardMetrics, BroadcastNotificationRequest
from app.schemas.events import WebSocketMessage
from app.services.audit_service import AuditService
from app.websocket.connection_manager import manager


class AdminService:
    """
    Business Logic Service managing global platform administration, dashboard metrics, user suspension, and workspace controls.
    """

    @staticmethod
    async def get_dashboard_metrics(db: AsyncSession) -> AdminDashboardMetrics:
        """
        Aggregates global platform usage metrics across all entities.
        """
        # User counts
        total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
        active_users = (
            await db.execute(select(func.count(User.id)).where(User.is_active == True))
        ).scalar() or 0
        suspended_users = total_users - active_users

        # Workspaces, Teams, Documents, Datasets
        total_ws = (await db.execute(select(func.count(Workspace.id)))).scalar() or 0
        total_teams = (await db.execute(select(func.count(Team.id)))).scalar() or 0
        total_docs = (await db.execute(select(func.count(Document.id)))).scalar() or 0
        total_datasets = (await db.execute(select(func.count(Dataset.id)))).scalar() or 0

        # Files and Storage
        total_files = (await db.execute(select(func.count(StoredFile.id)))).scalar() or 0
        storage_sum = (
            await db.execute(select(func.coalesce(func.sum(StoredFile.file_size_bytes), 0)))
        ).scalar() or 0

        # Jobs
        total_jobs = (await db.execute(select(func.count(BackgroundJob.id)))).scalar() or 0
        failed_jobs = (
            await db.execute(
                select(func.count(BackgroundJob.id)).where(BackgroundJob.status == "FAILED")
            )
        ).scalar() or 0

        # Security & Audits
        sec_events = (await db.execute(select(func.count(SecurityEvent.id)))).scalar() or 0
        audits = (await db.execute(select(func.count(AuditLog.id)))).scalar() or 0

        # WebSockets
        ws_count = manager.get_total_connections()

        return AdminDashboardMetrics(
            total_users=total_users,
            active_users=active_users,
            suspended_users=suspended_users,
            total_workspaces=total_ws,
            total_teams=total_teams,
            total_documents=total_docs,
            total_datasets=total_datasets,
            total_files=total_files,
            total_storage_bytes=storage_sum,
            total_jobs=total_jobs,
            failed_jobs=failed_jobs,
            connected_ws_clients=ws_count,
            security_events_count=sec_events,
            audit_logs_count=audits,
        )

    @staticmethod
    async def search_users(
        db: AsyncSession,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """
        Searches, filters, and paginates system users for administration.
        """
        page = max(1, page)
        page_size = max(1, page_size)
        skip = (page - 1) * page_size

        query = select(User)
        if is_active is not None:
            query = query.where(User.is_active == is_active)

        if search:
            term = f"%{search.strip()}%"
            query = query.where(or_(User.email.ilike(term), User.username.ilike(term)))

        count_query = select(func.count()).select_from(query.subquery())
        total_items = (await db.execute(count_query)).scalar() or 0

        query = query.order_by(User.created_at.desc()).offset(skip).limit(page_size)
        items = list((await db.execute(query)).scalars().all())

        return {"items": items, "total_items": total_items, "page": page, "page_size": page_size}

    @staticmethod
    async def suspend_user(user_id: uuid.UUID, admin_id: uuid.UUID, db: AsyncSession) -> Optional[User]:
        """
        Suspends a user account and logs audit record.
        """
        user = await db.get(User, user_id)
        if not user:
            return None

        user.is_active = False
        await db.commit()
        await db.refresh(user)

        # Audit log entry
        await AuditService.log_audit(
            action="ADMIN_USER_SUSPENDED",
            entity_type="User",
            entity_id=str(user_id),
            user_id=admin_id,
            description=f"Admin {admin_id} suspended user account {user.email}",
            db=db,
        )

        return user

    @staticmethod
    async def activate_user(user_id: uuid.UUID, admin_id: uuid.UUID, db: AsyncSession) -> Optional[User]:
        """
        Activates a suspended user account.
        """
        user = await db.get(User, user_id)
        if not user:
            return None

        user.is_active = True
        await db.commit()
        await db.refresh(user)

        await AuditService.log_audit(
            action="ADMIN_USER_ACTIVATED",
            entity_type="User",
            entity_id=str(user_id),
            user_id=admin_id,
            description=f"Admin {admin_id} activated user account {user.email}",
            db=db,
        )

        return user

    @staticmethod
    async def force_logout_user(user_id: uuid.UUID, admin_id: uuid.UUID, db: AsyncSession) -> bool:
        """
        Revokes all active user sessions for force logout.
        """
        user = await db.get(User, user_id)
        if not user:
            return False

        from sqlalchemy import delete
        stmt = delete(UserSession).where(UserSession.user_id == user_id)
        await db.execute(stmt)
        await db.commit()

        # Disconnect any open WebSocket connections for user
        await manager.disconnect_user(user_id)

        await AuditService.log_audit(
            action="ADMIN_USER_FORCE_LOGOUT",
            entity_type="User",
            entity_id=str(user_id),
            user_id=admin_id,
            description=f"Admin {admin_id} force logged out user {user.email}",
            db=db,
        )

        return True

    @staticmethod
    async def search_workspaces(
        db: AsyncSession,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """
        Searches, filters, and paginates system workspaces.
        """
        page = max(1, page)
        page_size = max(1, page_size)
        skip = (page - 1) * page_size

        query = select(Workspace)
        if search:
            term = f"%{search.strip()}%"
            query = query.where(or_(Workspace.name.ilike(term), Workspace.slug.ilike(term)))

        count_query = select(func.count()).select_from(query.subquery())
        total_items = (await db.execute(count_query)).scalar() or 0

        query = query.order_by(Workspace.created_at.desc()).offset(skip).limit(page_size)
        items = list((await db.execute(query)).scalars().all())

        return {"items": items, "total_items": total_items, "page": page, "page_size": page_size}

    @staticmethod
    async def broadcast_announcement(
        payload: BroadcastNotificationRequest, admin_id: uuid.UUID, db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Broadcasts system-wide announcement to all connected WebSocket clients.
        """
        msg = WebSocketMessage(
            event="system.announcement",
            data={
                "title": payload.title,
                "message": payload.message,
                "level": payload.level,
                "broadcast_by": str(admin_id),
            },
        )
        count = await manager.broadcast(msg)

        await AuditService.log_audit(
            action="ADMIN_BROADCAST_ANNOUNCEMENT",
            entity_type="System",
            user_id=admin_id,
            description=f"Admin broadcast announcement: '{payload.title}' to {count} connected sockets",
            db=db,
        )

        return {"broadcast_count": count, "title": payload.title, "level": payload.level}
