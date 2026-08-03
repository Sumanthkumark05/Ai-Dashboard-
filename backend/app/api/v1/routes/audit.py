import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.audit import AuditLogExportRequest, AuditLogListResponse, AuditLogResponse
from app.security.dependencies import get_current_user
from app.security.workspace_dependency import get_current_workspace
from app.services.audit_service import AuditService
from app.services.export_service import ExportService

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


@router.get(
    "",
    response_model=AuditLogListResponse,
    summary="List & Search Audit Logs",
    description="Returns paginated, searchable, and filtered audit log records.",
)
async def list_audit_logs(
    action: Optional[str] = Query(default=None, description="Filter by Action Type"),
    entity_type: Optional[str] = Query(default=None, description="Filter by Entity Type"),
    search: Optional[str] = Query(default=None, description="Search term in description or IP"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> AuditLogListResponse:
    data = await AuditService.search_audit_logs(
        db=db,
        workspace_id=current_ws.id,
        action=action,
        entity_type=entity_type,
        search=search,
        page=page,
        page_size=page_size,
    )
    items = [AuditLogResponse.model_validate(a) for a in data["items"]]
    return AuditLogListResponse(
        items=items,
        total_items=data["total_items"],
        page=data["page"],
        page_size=data["page_size"],
    )


@router.get(
    "/{audit_id}",
    response_model=AuditLogResponse,
    summary="Get Audit Log Details",
    description="Returns details and before/after value diff for a specific audit log ID.",
)
async def get_audit_log(
    audit_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> AuditLogResponse:
    repo = AuditLogRepository(db)
    log_entry = await repo.get_by_id(audit_id)
    if not log_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log record not found.",
        )
    return AuditLogResponse.model_validate(log_entry)


@router.post(
    "/export",
    summary="Export Audit Logs",
    description="Exports audit log records in CSV or JSON format.",
)
async def export_audit_logs(
    payload: AuditLogExportRequest,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Response:
    repo = AuditLogRepository(db)
    data = await repo.search_audit_logs(
        workspace_id=payload.workspace_id or current_ws.id,
        user_id=payload.user_id,
        action=payload.action,
        page=1,
        page_size=1000,
    )
    logs = data["items"]

    if payload.format.lower() == "json":
        json_content = ExportService.export_audit_logs_json(logs)
        return Response(
            content=json_content,
            media_type="application/json",
            headers={"Content-Disposition": 'attachment; filename="audit_logs.json"'},
        )

    csv_content = ExportService.export_audit_logs_csv(logs)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="audit_logs.csv"'},
    )
