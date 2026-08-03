import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.report import Report, ReportAttachment, ReportComment, ReportActivity
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
    ReportActivityResponse,
    ReportAnalyticsResponse,
)
from app.services.ai_service import GroqAIService


class ReportService:
    @staticmethod
    async def create_report(
        workspace_id: uuid.UUID,
        payload: CreateReportRequest,
        author: User,
        db: AsyncSession,
    ) -> Report:
        report = Report(
            id=uuid.uuid4(),
            workspace_id=workspace_id,
            author_id=author.id,
            title=payload.title.strip(),
            category=payload.category,
            content=payload.content,
            status=payload.status or "submitted",
            deadline=payload.deadline,
        )
        db.add(report)

        # Log initial activity
        activity = ReportActivity(
            id=uuid.uuid4(),
            report_id=report.id,
            workspace_id=workspace_id,
            actor_id=author.id,
            activity_type="created",
            message=f"Report '{report.title}' created by {author.username or author.email}.",
        )
        db.add(activity)

        await db.commit()
        await db.refresh(report)
        return report

    @staticmethod
    async def get_workspace_reports(
        workspace_id: uuid.UUID,
        db: AsyncSession,
        category: Optional[str] = None,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ReportResponse]:
        query = select(Report).where(Report.workspace_id == workspace_id)

        if category:
            query = query.where(Report.category == category)
        if status_filter:
            query = query.where(Report.status == status_filter)
        if search:
            q = f"%{search.strip().lower()}%"
            query = query.where(
                (func.lower(Report.title).like(q)) | (func.lower(Report.content).like(q))
            )

        query = query.order_by(Report.created_at.desc())
        result = await db.execute(query)
        reports = list(result.scalars().all())

        responses = []
        for r in reports:
            author_name = f"{r.author.first_name} {r.author.last_name}".strip() if r.author else "Workspace Member"
            if not author_name or author_name == "":
                author_name = r.author.username or r.author.email if r.author else "Workspace Member"

            resp = ReportResponse(
                id=r.id,
                workspace_id=r.workspace_id,
                author_id=r.author_id,
                author_name=author_name,
                author_email=r.author.email if r.author else None,
                author_avatar=r.author.avatar_url if r.author else None,
                reviewer_id=r.reviewer_id,
                reviewer_name=f"{r.reviewer.first_name} {r.reviewer.last_name}".strip() if r.reviewer else None,
                title=r.title,
                category=r.category,
                content=r.content,
                status=r.status,
                deadline=r.deadline,
                reviewed_at=r.reviewed_at,
                reviewer_feedback=r.reviewer_feedback,
                ai_summary=r.ai_summary,
                created_at=r.created_at,
                updated_at=r.updated_at,
                attachment_count=len(r.attachments),
                comment_count=len(r.comments),
                attachments=[ReportAttachmentResponse.model_validate(att) for att in r.attachments],
                comments=[
                    ReportCommentResponse(
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
                    for c in r.comments
                ],
                activities=[
                    ReportActivityResponse(
                        id=act.id,
                        report_id=act.report_id,
                        workspace_id=act.workspace_id,
                        actor_id=act.actor_id,
                        actor_name=f"{act.actor.first_name} {act.actor.last_name}".strip() if act.actor else "Member",
                        activity_type=act.activity_type,
                        message=act.message,
                        created_at=act.created_at,
                    )
                    for act in r.activities
                ],
            )
            responses.append(resp)

        return responses

    @staticmethod
    async def get_report_details(report_id: uuid.UUID, db: AsyncSession) -> ReportResponse:
        res = await db.execute(select(Report).where(Report.id == report_id))
        r = res.scalar_one_or_none()
        if not r:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

        author_name = f"{r.author.first_name} {r.author.last_name}".strip() if r.author else "Workspace Member"
        if not author_name or author_name == "":
            author_name = r.author.username or r.author.email if r.author else "Workspace Member"

        return ReportResponse(
            id=r.id,
            workspace_id=r.workspace_id,
            author_id=r.author_id,
            author_name=author_name,
            author_email=r.author.email if r.author else None,
            author_avatar=r.author.avatar_url if r.author else None,
            reviewer_id=r.reviewer_id,
            reviewer_name=f"{r.reviewer.first_name} {r.reviewer.last_name}".strip() if r.reviewer else None,
            title=r.title,
            category=r.category,
            content=r.content,
            status=r.status,
            deadline=r.deadline,
            reviewed_at=r.reviewed_at,
            reviewer_feedback=r.reviewer_feedback,
            ai_summary=r.ai_summary,
            created_at=r.created_at,
            updated_at=r.updated_at,
            attachment_count=len(r.attachments),
            comment_count=len(r.comments),
            attachments=[ReportAttachmentResponse.model_validate(att) for att in r.attachments],
            comments=[
                ReportCommentResponse(
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
                for c in r.comments
            ],
            activities=[
                ReportActivityResponse(
                    id=act.id,
                    report_id=act.report_id,
                    workspace_id=act.workspace_id,
                    actor_id=act.actor_id,
                    actor_name=f"{act.actor.first_name} {act.actor.last_name}".strip() if act.actor else "Member",
                    activity_type=act.activity_type,
                    message=act.message,
                    created_at=act.created_at,
                )
                for act in r.activities
            ],
        )

    @staticmethod
    async def update_report_status(
        report_id: uuid.UUID,
        payload: UpdateReportStatusRequest,
        reviewer: User,
        db: AsyncSession,
    ) -> Report:
        res = await db.execute(select(Report).where(Report.id == report_id))
        report = res.scalar_one_or_none()
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

        report.status = payload.status
        report.reviewer_id = reviewer.id
        report.reviewed_at = datetime.now(timezone.utc)
        if payload.feedback:
            report.reviewer_feedback = payload.feedback

        activity = ReportActivity(
            id=uuid.uuid4(),
            report_id=report.id,
            workspace_id=report.workspace_id,
            actor_id=reviewer.id,
            activity_type="status_changed",
            message=f"Report status updated to '{payload.status}' by {reviewer.username or reviewer.email}.",
        )
        db.add(activity)

        await db.commit()
        await db.refresh(report)
        return report

    @staticmethod
    async def add_attachment(
        report_id: uuid.UUID,
        payload: AddReportAttachmentRequest,
        uploader: User,
        db: AsyncSession,
    ) -> ReportAttachment:
        res = await db.execute(select(Report).where(Report.id == report_id))
        report = res.scalar_one_or_none()
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

        attachment = ReportAttachment(
            id=uuid.uuid4(),
            report_id=report.id,
            workspace_id=report.workspace_id,
            uploader_id=uploader.id,
            file_name=payload.file_name,
            file_path=payload.file_path,
            file_size=payload.file_size,
            file_type=payload.file_type,
        )
        db.add(attachment)

        activity = ReportActivity(
            id=uuid.uuid4(),
            report_id=report.id,
            workspace_id=report.workspace_id,
            actor_id=uploader.id,
            activity_type="attachment_added",
            message=f"Attachment '{payload.file_name}' added to report.",
        )
        db.add(activity)

        await db.commit()
        await db.refresh(attachment)
        return attachment

    @staticmethod
    async def add_comment(
        report_id: uuid.UUID,
        payload: CreateReportCommentRequest,
        author: User,
        db: AsyncSession,
    ) -> ReportComment:
        res = await db.execute(select(Report).where(Report.id == report_id))
        report = res.scalar_one_or_none()
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

        comment = ReportComment(
            id=uuid.uuid4(),
            report_id=report.id,
            author_id=author.id,
            parent_id=payload.parent_id,
            content=payload.content.strip(),
        )
        db.add(comment)

        activity = ReportActivity(
            id=uuid.uuid4(),
            report_id=report.id,
            workspace_id=report.workspace_id,
            actor_id=author.id,
            activity_type="comment_added",
            message=f"Comment added by {author.username or author.email}.",
        )
        db.add(activity)

        await db.commit()
        await db.refresh(comment)
        return comment

    @staticmethod
    async def get_workspace_analytics(workspace_id: uuid.UUID, db: AsyncSession) -> ReportAnalyticsResponse:
        res = await db.execute(select(Report).where(Report.workspace_id == workspace_id))
        reports = list(res.scalars().all())

        total = len(reports)
        pending = sum(1 for r in reports if r.status in ["submitted", "under_review", "draft"])
        approved = sum(1 for r in reports if r.status in ["approved", "completed"])
        rejected = sum(1 for r in reports if r.status == "rejected")
        needs_changes = sum(1 for r in reports if r.status == "needs_changes")

        completion_rate = round((approved / total * 100.0), 1) if total > 0 else 0.0

        cats = {}
        for r in reports:
            cats[r.category] = cats.get(r.category, 0) + 1

        return ReportAnalyticsResponse(
            total_reports=total,
            pending_review=pending,
            approved=approved,
            rejected=rejected,
            needs_changes=needs_changes,
            completion_rate=completion_rate,
            category_counts=cats,
        )

    @staticmethod
    async def generate_ai_summary(report_id: uuid.UUID, db: AsyncSession) -> str:
        res = await db.execute(select(Report).where(Report.id == report_id))
        report = res.scalar_one_or_none()
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")

        prompt = f"""You are an executive AI assistant. Analyze the following team report and generate a concise executive summary.
Report Title: {report.title}
Category: {report.category}
Status: {report.status}
Content:
{report.content}

Format output with markdown bullet points:
- **Executive Summary**:
- **Key Milestones / Accomplishments**:
- **Potential Risks / Blockers**:
- **Recommended Next Actions**:"""

        messages = [{"role": "user", "content": prompt}]
        summary = await GroqAIService.generate_chat_completion(messages=messages, model="openai/gpt-oss-120b")
        report.ai_summary = summary
        await db.commit()
        return summary
