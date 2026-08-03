import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class CreateReportRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200, description="Report title")
    category: str = Field("General", max_length=50, description="Report category")
    content: str = Field(..., min_length=5, description="Rich text or markdown report content")
    deadline: Optional[datetime] = Field(None, description="Optional completion deadline")
    status: Optional[str] = Field("submitted", description="draft or submitted")


class UpdateReportRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    category: Optional[str] = Field(None, max_length=50)
    content: Optional[str] = Field(None, min_length=5)
    deadline: Optional[datetime] = None


class UpdateReportStatusRequest(BaseModel):
    status: str = Field(..., description="submitted, under_review, approved, rejected, needs_changes, completed")
    feedback: Optional[str] = Field(None, description="Reviewer feedback or comments")


class CreateReportCommentRequest(BaseModel):
    content: str = Field(..., min_length=1, description="Comment text")
    parent_id: Optional[uuid.UUID] = Field(None, description="Parent comment ID for nested replies")


class AddReportAttachmentRequest(BaseModel):
    file_name: str = Field(..., max_length=255)
    file_path: str = Field(..., max_length=500)
    file_size: int = Field(..., ge=0)
    file_type: str = Field(..., max_length=100)


class ReportAttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    report_id: uuid.UUID
    workspace_id: uuid.UUID
    uploader_id: uuid.UUID
    file_name: str
    file_path: str
    file_size: int
    file_type: str
    created_at: datetime


class ReportCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    report_id: uuid.UUID
    author_id: uuid.UUID
    author_name: Optional[str] = "Workspace Member"
    author_avatar: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    content: str
    created_at: datetime
    updated_at: datetime


class ReportActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    report_id: uuid.UUID
    workspace_id: uuid.UUID
    actor_id: uuid.UUID
    actor_name: Optional[str] = "Workspace Member"
    activity_type: str
    message: str
    created_at: datetime


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    author_id: uuid.UUID
    author_name: Optional[str] = "Workspace Member"
    author_email: Optional[str] = None
    author_avatar: Optional[str] = None
    reviewer_id: Optional[uuid.UUID] = None
    reviewer_name: Optional[str] = None

    title: str
    category: str
    content: str
    status: str
    deadline: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewer_feedback: Optional[str] = None
    ai_summary: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    attachment_count: int = 0
    comment_count: int = 0

    attachments: List[ReportAttachmentResponse] = []
    comments: List[ReportCommentResponse] = []
    activities: List[ReportActivityResponse] = []


class ReportAnalyticsResponse(BaseModel):
    total_reports: int = 0
    pending_review: int = 0
    approved: int = 0
    rejected: int = 0
    needs_changes: int = 0
    completion_rate: float = 0.0
    category_counts: dict = {}


class AISummaryResponse(BaseModel):
    report_id: uuid.UUID
    ai_summary: str
