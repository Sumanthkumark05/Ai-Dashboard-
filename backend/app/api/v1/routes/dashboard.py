import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.dataset import Dataset
from app.models.document import Document
from app.models.stored_file import StoredFile
from app.models.user import User
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.security.dependencies import get_current_user
from app.security.organization_dependency import get_current_organization
from app.security.workspace_dependency import get_optional_workspace
from app.api.v1.routes.workspaces import format_bytes_human

router = APIRouter(prefix="/dashboard", tags=["Dashboard Telemetry"])


@router.get(
    "/summary",
    summary="Get Real-Time Dashboard Metrics",
    description="Returns unified real-time statistics for workspaces, files, documents, datasets, team members, storage usage, and dynamic intelligence summary.",
)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    current_org: Any = Depends(get_current_organization),
    current_ws: Optional[Workspace] = Depends(get_optional_workspace),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    # 1. Total Workspaces in current organization / for current user
    org_id = current_org.id if current_org else getattr(current_ws, "organization_id", None)
    ws_query = select(func.count(Workspace.id)).where(Workspace.is_deleted == False)
    if org_id:
        ws_query = ws_query.where(Workspace.organization_id == org_id)
    ws_count = (await db.execute(ws_query)).scalar() or 0

    if not current_ws:
        return {
            "workspaces": ws_count,
            "files": 0,
            "documents": 0,
            "datasets": 0,
            "teamMembers": 1,
            "storageUsedBytes": 0,
            "storageRemainingBytes": 10737418240,
            "capacityBytes": 10737418240,
            "storageUsedFormatted": "0 B",
            "storageRemainingFormatted": "10 GB",
            "capacityFormatted": "10 GB",
            "recentUploads": 0,
            "intelligenceSummary": "No workspaces found. Create your first workspace to start collaborating!",
        }

    # 2. Count Files in active workspace
    files_count = (
        await db.execute(
            select(func.count(StoredFile.id)).where(
                StoredFile.workspace_id == current_ws.id,
                StoredFile.is_deleted == False,
            )
        )
    ).scalar() or 0

    files_bytes = (
        await db.execute(
            select(func.coalesce(func.sum(StoredFile.size), 0)).where(
                StoredFile.workspace_id == current_ws.id,
                StoredFile.is_deleted == False,
            )
        )
    ).scalar() or 0

    # 3. Count Documents in active workspace
    docs_count = (
        await db.execute(
            select(func.count(Document.id)).where(
                Document.workspace_id == current_ws.id,
                Document.is_deleted == False,
            )
        )
    ).scalar() or 0

    # Non-duplicate document bytes
    sf_paths_res = await db.execute(
        select(StoredFile.storage_path).where(
            StoredFile.workspace_id == current_ws.id,
            StoredFile.is_deleted == False,
        )
    )
    sf_paths = set(sf_paths_res.scalars().all())

    docs_all = (
        await db.execute(
            select(Document).where(
                Document.workspace_id == current_ws.id,
                Document.is_deleted == False,
            )
        )
    ).scalars().all()

    additional_doc_bytes = sum(
        (doc.file_size or 0) for doc in docs_all if doc.storage_path not in sf_paths
    )

    # 4. Count Datasets in active workspace
    datasets_count = (
        await db.execute(
            select(func.count(Dataset.id)).where(
                Dataset.workspace_id == current_ws.id,
                Dataset.is_deleted == False,
            )
        )
    ).scalar() or 0

    datasets_bytes = (
        await db.execute(
            select(func.coalesce(func.sum(Dataset.file_size), 0)).where(
                Dataset.workspace_id == current_ws.id,
                Dataset.is_deleted == False,
            )
        )
    ).scalar() or 0

    # 5. Team Members Count
    members_count = (
        await db.execute(
            select(func.count(WorkspaceMember.id)).where(
                WorkspaceMember.workspace_id == current_ws.id
            )
        )
    ).scalar() or 1

    # 6. Total Storage Sum
    total_used_bytes = int(files_bytes + datasets_bytes + additional_doc_bytes)
    capacity_mb = current_ws.storage_limit or 10240.0
    capacity_bytes = int(capacity_mb * 1024 * 1024)
    remaining_bytes = max(0, capacity_bytes - total_used_bytes)
    formatted_used = format_bytes_human(total_used_bytes)
    formatted_remaining = format_bytes_human(remaining_bytes)
    formatted_capacity = format_bytes_human(capacity_bytes)

    # 7. Dynamic Intelligence Summary Text
    intelligence_summary = (
        f"Workspace analytics tracking {ws_count} workspace{'s' if ws_count != 1 else ''}, "
        f"{files_count} uploaded file{'s' if files_count != 1 else ''}, "
        f"{docs_count} document{'s' if docs_count != 1 else ''}, "
        f"{datasets_count} dataset{'s' if datasets_count != 1 else ''}, and "
        f"{formatted_used} of storage."
    )

    return {
        "workspaces": ws_count,
        "files": files_count,
        "documents": docs_count,
        "datasets": datasets_count,
        "teamMembers": members_count,
        "storageUsedBytes": total_used_bytes,
        "storageRemainingBytes": remaining_bytes,
        "capacityBytes": capacity_bytes,
        "storageUsedFormatted": formatted_used,
        "storageRemainingFormatted": formatted_remaining,
        "capacityFormatted": formatted_capacity,
        "recentUploads": files_count + docs_count + datasets_count,
        "intelligenceSummary": intelligence_summary,
    }
