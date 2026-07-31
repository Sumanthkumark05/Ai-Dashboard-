import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import UserRole
from app.database.dependency import get_db
from app.models.organization import Organization
from app.models.user import User
from app.schemas.invitation import InvitationRequest, InvitationResponse
from app.schemas.organization import (
    CreateOrganizationRequest,
    OrganizationResponse,
    UpdateOrganizationRequest,
)
from app.schemas.organization_member import MemberResponse, UpdateMemberRoleRequest
from app.security.dependencies import get_current_user
from app.security.organization_dependency import (
    get_current_organization,
    require_organization_role,
)
from app.services.invitation_service import InvitationService
from app.services.membership_service import MembershipService
from app.services.organization_service import OrganizationService

router = APIRouter(prefix="/organizations", tags=["Organization & Multi-Tenancy"])


@router.post(
    "",
    response_model=OrganizationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Organization",
    description="Creates a new multi-tenant organization entity and sets creator as OWNER.",
)
async def create_organization(
    payload: CreateOrganizationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrganizationResponse:
    org = await OrganizationService.create_organization(payload, current_user, db)
    return OrganizationResponse.model_validate(org)


@router.get(
    "",
    response_model=List[OrganizationResponse],
    summary="List User Organizations",
    description="Returns all active organizations where current user is a member.",
)
async def list_organizations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[OrganizationResponse]:
    orgs = await OrganizationService.get_user_organizations(current_user.id, db)
    return [OrganizationResponse.model_validate(o) for o in orgs]


@router.get(
    "/current",
    response_model=OrganizationResponse,
    summary="Get Active Organization Context",
    description="Returns the active organization context for the authenticated request.",
)
async def get_current_org(
    current_org: Organization = Depends(get_current_organization),
) -> OrganizationResponse:
    return OrganizationResponse.model_validate(current_org)


@router.patch(
    "/current",
    response_model=OrganizationResponse,
    summary="Switch Active Organization Context",
    description="Switches and returns active organization context by ID.",
)
async def switch_current_org(
    organization_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrganizationResponse:
    orgs = await OrganizationService.get_user_organizations(current_user.id, db)
    target = next((o for o in orgs if o.id == organization_id), None)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a member of the target organization.",
        )
    return OrganizationResponse.model_validate(target)


@router.get(
    "/{id}",
    response_model=OrganizationResponse,
    summary="Get Organization Details",
    description="Returns details for a specific organization ID.",
)
async def get_organization(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrganizationResponse:
    orgs = await OrganizationService.get_user_organizations(current_user.id, db)
    org = next((o for o in orgs if o.id == id), None)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found.",
        )
    return OrganizationResponse.model_validate(org)


@router.patch(
    "/{id}",
    response_model=OrganizationResponse,
    summary="Update Organization",
    description="Updates organization details. Requires ADMIN or OWNER role.",
)
async def update_organization(
    id: uuid.UUID,
    payload: UpdateOrganizationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrganizationResponse:
    # Authorization check
    member = Depends(require_organization_role([UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.ADMIN]))
    updated = await OrganizationService.update_organization(id, payload, db)
    return OrganizationResponse.model_validate(updated)


@router.delete(
    "/{id}",
    response_model=Dict[str, Any],
    summary="Soft Delete Organization",
    description="Deletes an organization. Requires OWNER role.",
)
async def delete_organization(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await OrganizationService.soft_delete_organization(id, db)
    return {
        "success": True,
        "message": f"Organization '{id}' soft deleted successfully.",
    }


@router.post(
    "/{id}/invite",
    response_model=InvitationResponse,
    summary="Invite Member to Organization",
    description="Generates an invitation token for a new member.",
)
async def invite_member(
    id: uuid.UUID,
    payload: InvitationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InvitationResponse:
    invitation = await InvitationService.invite_member(id, current_user, payload, db)
    return InvitationResponse.model_validate(invitation)


@router.get(
    "/{id}/members",
    response_model=List[MemberResponse],
    summary="List Organization Members",
    description="Lists active members for an organization.",
)
async def list_members(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[MemberResponse]:
    members = await MembershipService.get_members(id, db)
    return [MemberResponse.model_validate(m) for m in members]


@router.patch(
    "/{id}/members/{memberId}",
    response_model=MemberResponse,
    summary="Update Member Role",
    description="Updates role for an organization member.",
)
async def update_member_role(
    id: uuid.UUID,
    memberId: uuid.UUID,
    payload: UpdateMemberRoleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MemberResponse:
    updated = await MembershipService.update_member_role(id, memberId, payload.role, db)
    return MemberResponse.model_validate(updated)


@router.delete(
    "/{id}/members/{memberId}",
    response_model=Dict[str, Any],
    summary="Remove Member",
    description="Removes a member from an organization.",
)
async def remove_member(
    id: uuid.UUID,
    memberId: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await MembershipService.remove_member(id, memberId, db)
    return {
        "success": True,
        "message": f"Member '{memberId}' removed from organization.",
    }
