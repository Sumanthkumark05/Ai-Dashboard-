import datetime
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.calendar_event import CalendarEvent, EventAssignment
from app.models.report import Report
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.security.dependencies import get_current_user
from app.security.workspace_dependency import get_current_workspace

router = APIRouter(prefix="/calendar", tags=["Calendar & Scheduling"])

EVENT_COLOR_MAP = {
    "Client Demo": "#3b82f6",       # Blue
    "Client Meeting": "#10b981",    # Green
    "Internal Meeting": "#059669",  # Emerald
    "Project Deadline": "#ef4444",  # Red
    "Code Review": "#f59e0b",       # Orange
    "Testing": "#d97706",           # Amber
    "Deployment": "#8b5cf6",        # Purple
    "Report Submission": "#6366f1", # Indigo
    "Dataset Review": "#06b6d4",    # Cyan
    "Document Review": "#0d9488",   # Teal
    "Custom Event": "#64748b",      # Slate
}


@router.get(
    "/events",
    summary="List Calendar Events",
    description="Returns calendar events for active workspace or all workspaces with filters.",
)
async def list_calendar_events(
    workspace_id: Optional[str] = Query(default=None, description="Workspace filter ID or 'all'"),
    event_type: Optional[str] = Query(default=None, description="Event type filter"),
    status: Optional[str] = Query(default=None, description="Status filter"),
    search: Optional[str] = Query(default=None, description="Search query"),
    current_user: User = Depends(get_current_user),
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    query = select(CalendarEvent).where(CalendarEvent.is_deleted == False)

    if workspace_id and workspace_id != "all":
        try:
            ws_uuid = uuid.UUID(workspace_id)
            query = query.where(CalendarEvent.workspace_id == ws_uuid)
        except ValueError:
            pass
    elif current_ws:
        query = query.where(
            or_(CalendarEvent.workspace_id == current_ws.id, CalendarEvent.workspace_id == None)
        )

    if event_type and event_type != "all":
        query = query.where(CalendarEvent.event_type == event_type)

    if status and status != "all":
        query = query.where(CalendarEvent.status == status)

    if search:
        s_term = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(CalendarEvent.title).like(s_term),
                func.lower(CalendarEvent.description).like(s_term),
                func.lower(CalendarEvent.client_name).like(s_term),
                func.lower(CalendarEvent.project_name).like(s_term),
            )
        )

    query = query.order_by(CalendarEvent.start_date.asc(), CalendarEvent.start_time.asc())
    res = await db.execute(query)
    events = res.scalars().all()

    items = []
    for e in events:
        items.append({
            "id": str(e.id),
            "workspace_id": str(e.workspace_id) if e.workspace_id else None,
            "created_by": str(e.created_by),
            "title": e.title,
            "description": e.description or "",
            "event_type": e.event_type,
            "client_name": e.client_name or "",
            "project_name": e.project_name or "",
            "date": e.start_date,
            "start_date": e.start_date,
            "end_date": e.end_date or e.start_date,
            "time": e.start_time or "09:00",
            "start_time": e.start_time or "09:00",
            "end_time": e.end_time or "10:00",
            "priority": e.priority,
            "status": e.status,
            "location": e.location or "",
            "meeting_link": e.meeting_link or "",
            "color": e.color or EVENT_COLOR_MAP.get(e.event_type, "#3b82f6"),
            "category": e.event_type,
            "notes": e.notes or "",
            "is_auto_generated": e.is_auto_generated,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "updated_at": e.updated_at.isoformat() if e.updated_at else None,
        })

    return {"items": items, "total": len(items)}


@router.post(
    "/events",
    summary="Create Manual Calendar Event",
    description="Creates a new manual calendar event.",
)
async def create_calendar_event(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    title = payload.get("title", "").strip()
    if not title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required.")

    ev_type = payload.get("event_type") or payload.get("category") or "Custom Event"
    color = EVENT_COLOR_MAP.get(ev_type, "#3b82f6")

    ws_id = current_ws.id
    if payload.get("workspace_id"):
        try:
            ws_id = uuid.UUID(payload["workspace_id"])
        except ValueError:
            pass

    event = CalendarEvent(
        workspace_id=ws_id,
        created_by=current_user.id,
        title=title,
        description=payload.get("description"),
        event_type=ev_type,
        client_name=payload.get("client_name"),
        project_name=payload.get("project_name"),
        start_date=payload.get("start_date") or payload.get("date") or datetime.date.today().isoformat(),
        end_date=payload.get("end_date") or payload.get("start_date") or datetime.date.today().isoformat(),
        start_time=payload.get("start_time") or payload.get("time") or "09:00",
        end_time=payload.get("end_time") or "10:00",
        priority=payload.get("priority", "medium"),
        status=payload.get("status", "Scheduled"),
        location=payload.get("location"),
        meeting_link=payload.get("meeting_link"),
        color=color,
        notes=payload.get("notes"),
        is_auto_generated=False,
    )

    db.add(event)
    await db.commit()
    await db.refresh(event)

    return {
        "id": str(event.id),
        "workspace_id": str(event.workspace_id) if event.workspace_id else None,
        "title": event.title,
        "event_type": event.event_type,
        "date": event.start_date,
        "time": event.start_time,
        "status": event.status,
        "color": event.color,
    }


@router.patch(
    "/events/{event_id}",
    summary="Update Calendar Event",
    description="Updates event dates, status, or details.",
)
async def update_calendar_event(
    event_id: uuid.UUID,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    event = await db.get(CalendarEvent, event_id)
    if not event or event.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    for field in [
        "title", "description", "event_type", "client_name", "project_name",
        "start_date", "end_date", "start_time", "end_time", "priority",
        "status", "location", "meeting_link", "notes", "color"
    ]:
        if field in payload and payload[field] is not None:
            setattr(event, field, payload[field])

    if "date" in payload and payload["date"]:
        event.start_date = payload["date"]
    if "time" in payload and payload["time"]:
        event.start_time = payload["time"]

    if "event_type" in payload and payload["event_type"]:
        event.color = EVENT_COLOR_MAP.get(payload["event_type"], event.color)

    db.add(event)
    await db.commit()
    await db.refresh(event)

    return {"success": True, "id": str(event.id), "status": event.status}


@router.delete(
    "/events/{event_id}",
    summary="Delete Calendar Event",
)
async def delete_calendar_event(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    event = await db.get(CalendarEvent, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    event.is_deleted = True
    db.add(event)
    await db.commit()
    return {"success": True, "message": f"Event {event_id} deleted."}


@router.post(
    "/sync-workspace/{workspace_id}",
    summary="Auto Sync Workspace Dates with Calendar",
    description="Scans Workspace scheduling dates (Client Demo, Review Meeting, Deadline) and creates/updates Calendar events.",
)
async def sync_workspace_calendar(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    ws = await db.get(Workspace, workspace_id)
    if not ws or ws.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found.")

    if getattr(ws, "project_type", "internal") != "client":
        return {"success": True, "message": "Internal project - calendar sync skipped.", "synced_events": []}

    created_events = []

    # 1. Client Demo Event
    if ws.client_demo_date:
        query = select(CalendarEvent).where(
            CalendarEvent.workspace_id == ws.id,
            CalendarEvent.event_type == "Client Demo",
            CalendarEvent.is_deleted == False,
        )
        existing = (await db.execute(query)).scalar_one_or_none()
        if existing:
            existing.start_date = ws.client_demo_date
            existing.end_date = ws.client_demo_date
            existing.client_name = ws.client_name or existing.client_name
            existing.project_name = ws.name
            db.add(existing)
        else:
            ev = CalendarEvent(
                workspace_id=ws.id,
                created_by=current_user.id,
                title=f"📅 Client Demo - {ws.name}",
                description=f"Client demo session for project '{ws.name}' with client {ws.client_name or 'Client'}.",
                event_type="Client Demo",
                client_name=ws.client_name,
                project_name=ws.name,
                start_date=ws.client_demo_date,
                end_date=ws.client_demo_date,
                start_time="10:00",
                end_time="11:00",
                priority=ws.priority or "high",
                status="Scheduled",
                color="#3b82f6",
                is_auto_generated=True,
            )
            db.add(ev)
            created_events.append("Client Demo")

    # 2. Internal Review Meeting
    if ws.internal_review_date:
        query = select(CalendarEvent).where(
            CalendarEvent.workspace_id == ws.id,
            CalendarEvent.event_type == "Internal Meeting",
            CalendarEvent.is_deleted == False,
        )
        existing = (await db.execute(query)).scalar_one_or_none()
        if existing:
            existing.start_date = ws.internal_review_date
            existing.end_date = ws.internal_review_date
            existing.project_name = ws.name
            db.add(existing)
        else:
            ev = CalendarEvent(
                workspace_id=ws.id,
                created_by=current_user.id,
                title=f"📅 Review Meeting - {ws.name}",
                description=f"Internal review meeting for workspace '{ws.name}'.",
                event_type="Internal Meeting",
                client_name=ws.client_name,
                project_name=ws.name,
                start_date=ws.internal_review_date,
                end_date=ws.internal_review_date,
                start_time="14:00",
                end_time="15:00",
                priority="medium",
                status="Scheduled",
                color="#059669",
                is_auto_generated=True,
            )
            db.add(ev)
            created_events.append("Review Meeting")

    # 3. Project Deadline
    dl_date = ws.final_delivery_date or ws.end_date
    if dl_date:
        query = select(CalendarEvent).where(
            CalendarEvent.workspace_id == ws.id,
            CalendarEvent.event_type == "Project Deadline",
            CalendarEvent.is_deleted == False,
        )
        existing = (await db.execute(query)).scalar_one_or_none()
        if existing:
            existing.start_date = dl_date
            existing.end_date = dl_date
            existing.project_name = ws.name
            db.add(existing)
        else:
            ev = CalendarEvent(
                workspace_id=ws.id,
                created_by=current_user.id,
                title=f"📅 Project Deadline - {ws.name}",
                description=f"Final delivery deadline for workspace '{ws.name}'.",
                event_type="Project Deadline",
                client_name=ws.client_name,
                project_name=ws.name,
                start_date=dl_date,
                end_date=dl_date,
                start_time="17:00",
                end_time="18:00",
                priority="urgent",
                status="Upcoming",
                color="#ef4444",
                is_auto_generated=True,
            )
            db.add(ev)
            created_events.append("Project Deadline")

    await db.commit()
    return {"success": True, "synced_events": created_events}


@router.get(
    "/summary",
    summary="Get Calendar Summary for Dashboard & Analytics",
)
async def get_calendar_summary(
    current_user: User = Depends(get_current_user),
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    today_str = datetime.date.today().isoformat()
    
    query = select(CalendarEvent).where(
        CalendarEvent.workspace_id == current_ws.id,
        CalendarEvent.is_deleted == False,
    )
    res = await db.execute(query)
    all_events = res.scalars().all()

    todays_events = [e for e in all_events if e.start_date == today_str]
    upcoming_meetings = [e for e in all_events if e.event_type in ["Client Meeting", "Internal Meeting", "Client Demo"] and e.status in ["Scheduled", "Upcoming"]]
    upcoming_deadlines = [e for e in all_events if e.event_type == "Project Deadline" and e.status in ["Scheduled", "Upcoming"]]
    pending_reports = [e for e in all_events if e.event_type == "Report Submission" and e.status in ["Scheduled", "Upcoming"]]
    client_demos = [e for e in all_events if e.event_type == "Client Demo"]
    completed_events = [e for e in all_events if e.status == "Completed"]
    missed_events = [e for e in all_events if e.status in ["Missed", "Overdue"]]

    total_cnt = len(all_events)
    comp_cnt = len(completed_events)
    comp_rate = round((comp_cnt / total_cnt) * 100, 1) if total_cnt > 0 else 100.0

    return {
        "today_count": len(todays_events),
        "upcoming_meetings": len(upcoming_meetings),
        "upcoming_deadlines": len(upcoming_deadlines),
        "pending_reports": len(pending_reports),
        "client_demos": len(client_demos),
        "completed_count": comp_cnt,
        "missed_count": len(missed_events),
        "total_events": total_cnt,
        "completion_rate": comp_rate,
        "today_items": [
            {
                "id": str(e.id),
                "title": e.title,
                "event_type": e.event_type,
                "time": e.start_time,
                "status": e.status,
                "color": e.color,
            }
            for e in todays_events[:5]
        ],
    }
