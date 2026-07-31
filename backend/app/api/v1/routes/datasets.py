import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.dataset_repository import DatasetRepository
from app.schemas.dataset import (
    CreateDatasetRequest,
    DatasetListResponse,
    DatasetResponse,
    DatasetStatisticsResponse,
    DatasetVersionResponse,
    UpdateDatasetRequest,
)
from app.security.dependencies import get_current_user
from app.security.workspace_dependency import get_current_workspace
from app.services.dataset_service import DatasetService
from app.services.dataset_statistics_service import DatasetStatisticsService

router = APIRouter(prefix="/datasets", tags=["Dataset Management"])


@router.post(
    "",
    response_model=DatasetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Dataset Metadata",
    description="Registers new dataset metadata entry and initial version 1 inside the active workspace.",
)
async def create_dataset(
    payload: CreateDatasetRequest,
    current_ws: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DatasetResponse:
    dataset = await DatasetService.create_dataset(
        current_ws, payload, current_user, db
    )
    tags = await DatasetRepository(db).get_dataset_tags(dataset.id)
    resp = DatasetResponse.model_validate(dataset)
    resp.tags = tags
    return resp


@router.get(
    "/statistics",
    response_model=DatasetStatisticsResponse,
    summary="Get Workspace Dataset Statistics",
    description="Returns aggregate dataset metrics for the active workspace.",
)
async def get_workspace_dataset_statistics(
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> DatasetStatisticsResponse:
    stats = await DatasetStatisticsService.get_workspace_statistics(current_ws.id, db)
    return DatasetStatisticsResponse(**stats)


@router.get(
    "",
    response_model=DatasetListResponse,
    summary="List Workspace Datasets",
    description="Returns paginated datasets in the active workspace with search and filtering.",
)
async def list_datasets(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None, description="Search name, description, or filename"),
    dataset_type: Optional[str] = Query(default=None, description="Filter by dataset format type"),
    status_filter: Optional[str] = Query(default=None, alias="status", description="Filter by operational status"),
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> DatasetListResponse:
    data = await DatasetService.get_workspace_datasets(
        workspace_id=current_ws.id,
        page=page,
        page_size=page_size,
        search=search,
        dataset_type=dataset_type,
        status_filter=status_filter,
        db=db,
    )

    items_validated: List[DatasetResponse] = []
    repo = DatasetRepository(db)
    for item in data["items"]:
        resp = DatasetResponse.model_validate(item)
        resp.tags = await repo.get_dataset_tags(item.id)
        items_validated.append(resp)

    return DatasetListResponse(
        items=items_validated,
        total_items=data["total_items"],
        page=data["page"],
        page_size=data["page_size"],
    )


@router.get(
    "/{id}",
    response_model=DatasetResponse,
    summary="Get Dataset Details",
    description="Returns details for a specific dataset ID.",
)
async def get_dataset(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> DatasetResponse:
    repo = DatasetRepository(db)
    dataset = await repo.get_by_id(id)
    if not dataset or dataset.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found.",
        )
    resp = DatasetResponse.model_validate(dataset)
    resp.tags = await repo.get_dataset_tags(id)
    return resp


@router.patch(
    "/{id}",
    response_model=DatasetResponse,
    summary="Update Dataset Metadata",
    description="Updates dataset metadata details (name, description, dataset_type, visibility, tags).",
)
async def update_dataset(
    id: uuid.UUID,
    payload: UpdateDatasetRequest,
    db: AsyncSession = Depends(get_db),
) -> DatasetResponse:
    updated = await DatasetService.update_dataset(id, payload, db)
    resp = DatasetResponse.model_validate(updated)
    resp.tags = await DatasetRepository(db).get_dataset_tags(id)
    return resp


@router.delete(
    "/{id}",
    response_model=Dict[str, Any],
    summary="Soft Delete Dataset",
    description="Soft deletes a dataset and updates workspace storage counters.",
)
async def delete_dataset(
    id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await DatasetService.soft_delete_dataset(id, current_ws, db)
    return {
        "success": True,
        "message": f"Dataset '{id}' soft deleted successfully.",
    }


@router.post(
    "/{id}/favorite",
    response_model=DatasetResponse,
    summary="Toggle Dataset Favorite",
    description="Toggles the favorite flag for a dataset.",
)
async def toggle_favorite(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> DatasetResponse:
    dataset = await DatasetService.toggle_favorite(id, db)
    resp = DatasetResponse.model_validate(dataset)
    resp.tags = await DatasetRepository(db).get_dataset_tags(id)
    return resp


@router.get(
    "/{id}/versions",
    response_model=List[DatasetVersionResponse],
    summary="List Dataset Versions",
    description="Returns version history for a dataset.",
)
async def list_versions(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> List[DatasetVersionResponse]:
    versions = await DatasetService.get_dataset_versions(id, db)
    return [DatasetVersionResponse.model_validate(v) for v in versions]


@router.post(
    "/{id}/restore",
    response_model=DatasetResponse,
    summary="Restore Deleted Dataset",
    description="Restores a soft deleted dataset.",
)
async def restore_dataset(
    id: uuid.UUID,
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> DatasetResponse:
    dataset = await DatasetService.restore_dataset(id, current_ws, db)
    resp = DatasetResponse.model_validate(dataset)
    resp.tags = await DatasetRepository(db).get_dataset_tags(id)
    return resp
