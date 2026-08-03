import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.repositories.security_event_repository import SecurityEventRepository
from app.schemas.security_event import SecurityEventListResponse, SecurityEventResponse
from app.security.dependencies import get_current_user
from app.services.security_event_service import SecurityEventService

router = APIRouter(prefix="/security", tags=["Security Events & Diagnostics"])


@router.get(
    "/events",
    response_model=SecurityEventListResponse,
    summary="List Security Events",
    description="Returns paginated security event logs, rate limit hits, and brute force warnings.",
)
async def list_security_events(
    severity: Optional[str] = Query(default=None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    event_type: Optional[str] = Query(default=None, description="Filter by event type"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> SecurityEventListResponse:
    data = await SecurityEventService.search_events(
        db=db,
        severity=severity,
        event_type=event_type,
        page=page,
        page_size=page_size,
    )
    items = [SecurityEventResponse.model_validate(e) for e in data["items"]]
    return SecurityEventListResponse(
        items=items,
        total_items=data["total_items"],
        page=data["page"],
        page_size=data["page_size"],
    )


@router.get(
    "/events/{event_id}",
    response_model=SecurityEventResponse,
    summary="Get Security Event Details",
    description="Returns details for a specific security event ID.",
)
async def get_security_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> SecurityEventResponse:
    repo = SecurityEventRepository(db)
    event = await repo.get_by_id(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Security event record not found.",
        )
    return SecurityEventResponse.model_validate(event)
