import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.user import User
from app.repositories.permission_repository import PermissionRepository
from app.schemas.permission import PermissionResponse
from app.security.dependencies import get_current_user
from app.services.permission_service import PermissionService

router = APIRouter(prefix="/permissions", tags=["Fine-Grained Permissions"])


@router.get(
    "",
    response_model=List[PermissionResponse],
    summary="List System Permissions",
    description="Returns all fine-grained system permission definitions.",
)
async def list_permissions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[PermissionResponse]:
    repo = PermissionRepository(db)
    perms = await PermissionService.get_permissions(repo)
    return [PermissionResponse.model_validate(p) for p in perms]


@router.get(
    "/{permission_id}",
    response_model=PermissionResponse,
    summary="Get Permission Details",
    description="Returns details for a specific permission ID.",
)
async def get_permission(
    permission_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PermissionResponse:
    repo = PermissionRepository(db)
    perm = await PermissionService.get_permission_by_id(permission_id, repo)
    if not perm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Permission with ID '{permission_id}' not found.",
        )
    return PermissionResponse.model_validate(perm)
