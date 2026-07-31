import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.schemas.role import RoleResponse
from app.security.dependencies import get_current_user
from app.services.permission_service import PermissionService

router = APIRouter(prefix="/roles", tags=["Role & Access Control Management"])


@router.get(
    "",
    response_model=List[RoleResponse],
    summary="List All System Roles",
    description="Returns all registered RBAC system roles.",
)
async def list_roles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[RoleResponse]:
    repo = RoleRepository(db)
    roles = await PermissionService.get_roles(repo)
    return [RoleResponse.model_validate(r) for r in roles]


@router.get(
    "/{role_id}",
    response_model=RoleResponse,
    summary="Get Role Details",
    description="Returns details and associated permissions for a specific role ID.",
)
async def get_role(
    role_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoleResponse:
    repo = RoleRepository(db)
    role = await PermissionService.get_role_by_id(role_id, repo)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with ID '{role_id}' not found.",
        )
    return RoleResponse.model_validate(role)
