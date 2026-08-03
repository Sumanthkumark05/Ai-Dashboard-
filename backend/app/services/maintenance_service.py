import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.maintenance_mode import MaintenanceMode
from app.schemas.events import WebSocketMessage
from app.schemas.maintenance import EnableMaintenanceRequest
from app.websocket.connection_manager import manager


class MaintenanceService:
    """
    Business Logic Service managing maintenance mode state and WebSocket broadcasting.
    """

    @classmethod
    async def get_status(cls, db: AsyncSession) -> Optional[MaintenanceMode]:
        """
        Fetches current maintenance mode configuration.
        """
        stmt = select(MaintenanceMode).order_by(MaintenanceMode.created_at.desc())
        res = await db.execute(stmt)
        return res.scalars().first()

    @classmethod
    async def enable_maintenance(
        cls, payload: EnableMaintenanceRequest, user_id: uuid.UUID, db: AsyncSession
    ) -> MaintenanceMode:
        """
        Enables system maintenance mode and broadcasts warning to connected WebSocket clients.
        """
        status = await cls.get_status(db)
        if not status:
            status = MaintenanceMode(
                enabled=True,
                message=payload.message,
                start_time=payload.start_time,
                end_time=payload.end_time,
                enabled_by=user_id,
            )
            db.add(status)
        else:
            status.enabled = True
            status.message = payload.message
            status.start_time = payload.start_time
            status.end_time = payload.end_time
            status.enabled_by = user_id

        await db.commit()
        await db.refresh(status)

        # Broadcast maintenance mode notification over WebSocket
        msg = WebSocketMessage(
            event="system.maintenance",
            data={
                "enabled": True,
                "message": payload.message,
                "start_time": payload.start_time.isoformat() if payload.start_time else None,
            },
        )
        await manager.broadcast(msg)
        return status

    @classmethod
    async def disable_maintenance(cls, user_id: uuid.UUID, db: AsyncSession) -> MaintenanceMode:
        """
        Disables maintenance mode and restores standard platform operations.
        """
        status = await cls.get_status(db)
        if not status:
            status = MaintenanceMode(enabled=False, message="System operational", enabled_by=user_id)
            db.add(status)
        else:
            status.enabled = False
            status.enabled_by = user_id

        await db.commit()
        await db.refresh(status)

        # Broadcast resolution message over WebSocket
        msg = WebSocketMessage(
            event="system.maintenance",
            data={"enabled": False, "message": "System operations resumed normally."},
        )
        await manager.broadcast(msg)
        return status
