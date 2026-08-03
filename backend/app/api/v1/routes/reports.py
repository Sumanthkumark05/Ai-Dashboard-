import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.user import User
from app.schemas.report import (
    CreateReportRequest,
    UpdateReportRequest,
    UpdateReportStatusRequest,
    CreateReportCommentRequest,
    AddReportAttachmentRequest,
    ReportResponse,
    ReportAttachmentResponse,
    ReportCommentResponse,
    ReportAnalyticsResponse,
    AISummaryResponse,
)
from app.security.dependencies import get_current_user
from app.services.report_service import ReportService

router = APIRouter(tags=["Team Reports Management"])


@router.post(
    "/workspaces/{workspace_id}/reports",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or Submit Report",
)
async def create_workspace_report(
    workspace_id: uuid.UUID,
    payload: CreateReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    report = await ReportService.create_report(workspace_id, payload, current_user, db)
    return await ReportService.get_report_details(report.id, db)


@router.get(
    "/workspaces/{workspace_id}/reports",
    response_model=List[ReportResponse],
    summary="List Workspace Reports",
)
async def list_workspace_reports(
    workspace_id: uuid.UUID,
    category: Optional[str] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    search: Optional[str] = Query(None, description="Search term"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ReportService.get_workspace_reports(
        workspace_id, db, category=category, status_filter=status_filter, search=search
    )


@router.get(
    "/workspaces/{workspace_id}/reports/analytics",
    response_model=ReportAnalyticsResponse,
    summary="Get Workspace Report Analytics",
)
async def get_workspace_report_analytics(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ReportService.get_workspace_analytics(workspace_id, db)


@router.get(
    "/reports/{report_id}",
    response_model=ReportResponse,
    summary="Get Report Details",
)
async def get_report_details(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ReportService.get_report_details(report_id, db)


@router.patch(
    "/reports/{report_id}/status",
    response_model=ReportResponse,
    summary="Review Report Status",
)
async def update_report_status(
    report_id: uuid.UUID,
    payload: UpdateReportStatusRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ReportService.update_report_status(report_id, payload, current_user, db)
    return await ReportService.get_report_details(report_id, db)


@router.post(
    "/reports/{report_id}/attachments",
    response_model=ReportAttachmentResponse,
    summary="Add Attachment to Report",
)
async def add_report_attachment(
    report_id: uuid.UUID,
    payload: AddReportAttachmentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    att = await ReportService.add_attachment(report_id, payload, current_user, db)
    return ReportAttachmentResponse.model_validate(att)


@router.post(
    "/reports/{report_id}/comments",
    response_model=ReportCommentResponse,
    summary="Add Comment to Report",
)
async def add_report_comment(
    report_id: uuid.UUID,
    payload: CreateReportCommentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    c = await ReportService.add_comment(report_id, payload, current_user, db)
    return ReportCommentResponse(
        id=c.id,
        report_id=c.report_id,
        author_id=c.author_id,
        author_name=f"{c.author.first_name} {c.author.last_name}".strip() if c.author else "Member",
        author_avatar=c.author.avatar_url if c.author else None,
        parent_id=c.parent_id,
        content=c.content,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


@router.post(
    "/reports/{report_id}/summarize",
    response_model=AISummaryResponse,
    summary="Generate AI Executive Summary",
)
async def generate_ai_report_summary(
    report_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    summary = await ReportService.generate_ai_summary(report_id, db)
    return AISummaryResponse(report_id=report_id, ai_summary=summary)
