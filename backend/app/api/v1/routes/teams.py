import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import TeamRole
from app.database.dependency import get_db
from app.models.team_member import TeamMember
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.team_repository import TeamRepository
from app.schemas.invitation import TeamInvitationResponse
from app.schemas.member import (
    InviteMemberRequest,
    TeamMemberListResponse,
    TeamMemberResponse,
    UpdateMemberRoleRequest,
)
from app.schemas.team import (
    CreateTeamRequest,
    TeamListResponse,
    TeamResponse,
    TransferOwnershipRequest,
    UpdateTeamRequest,
)
from app.security.dependencies import get_current_user
from app.security.team_dependency import get_current_team_member, require_team_role
from app.security.workspace_dependency import get_current_workspace
from app.services.member_service import MemberService
from app.services.team_service import TeamService

router = APIRouter(prefix="/teams", tags=["Team & Role Management"])


@router.post(
    "",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Team",
    description="Creates a new Team inside the active Workspace and assigns creator as OWNER.",
)
async def create_team(
    payload: CreateTeamRequest,
    current_ws: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamResponse:
    team = await TeamService.create_team(current_ws, payload, current_user, db)
    return TeamResponse.model_validate(team)


@router.get(
    "",
    response_model=TeamListResponse,
    summary="List Workspace Teams",
    description="Returns paginated teams in the active workspace with search support.",
)
async def list_teams(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None, description="Search team name or description"),
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> TeamListResponse:
    data = await TeamService.get_workspace_teams(
        workspace_id=current_ws.id,
        page=page,
        page_size=page_size,
        search=search,
        db=db,
    )
    items_validated = [TeamResponse.model_validate(item) for item in data["items"]]

    return TeamListResponse(
        items=items_validated,
        total_items=data["total_items"],
        page=data["page"],
        page_size=data["page_size"],
    )


@router.get(
    "/{team_id}",
    response_model=TeamResponse,
    summary="Get Team Details",
    description="Returns details for a specific Team ID.",
)
async def get_team(
    team_id: uuid.UUID,
    current_member: TeamMember = Depends(require_team_role(TeamRole.VIEWER)),
    db: AsyncSession = Depends(get_db),
) -> TeamResponse:
    repo = TeamRepository(db)
    team = await repo.get_by_id(team_id)
    if not team or team.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found.",
        )
    return TeamResponse.model_validate(team)


@router.put(
    "/{team_id}",
    response_model=TeamResponse,
    summary="Update Team",
    description="Updates team information (name, description, avatar). Requires ADMIN or OWNER role.",
)
async def update_team(
    team_id: uuid.UUID,
    payload: UpdateTeamRequest,
    current_member: TeamMember = Depends(require_team_role(TeamRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> TeamResponse:
    updated = await TeamService.update_team(team_id, payload, db)
    return TeamResponse.model_validate(updated)


@router.delete(
    "/{team_id}",
    response_model=Dict[str, Any],
    summary="Delete Team",
    description="Soft deletes a team and cleans up memberships. Requires OWNER role.",
)
async def delete_team(
    team_id: uuid.UUID,
    current_member: TeamMember = Depends(require_team_role(TeamRole.OWNER)),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await TeamService.delete_team(team_id, db)
    return {
        "success": True,
        "message": f"Team '{team_id}' deleted successfully.",
    }


@router.put(
    "/{team_id}/transfer-owner",
    response_model=TeamResponse,
    summary="Transfer Team Ownership",
    description="Transfers team ownership to another active member. Requires current OWNER role.",
)
async def transfer_ownership(
    team_id: uuid.UUID,
    payload: TransferOwnershipRequest,
    current_user: User = Depends(get_current_user),
    current_member: TeamMember = Depends(require_team_role(TeamRole.OWNER)),
    db: AsyncSession = Depends(get_db),
) -> TeamResponse:
    repo = TeamRepository(db)
    team = await repo.get_by_id(team_id)
    if not team or team.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found.",
        )

    transferred = await TeamService.transfer_ownership(
        team, payload.new_owner_id, current_user, db
    )
    return TeamResponse.model_validate(transferred)


# ====================================================================
# Member Management Endpoints
# ====================================================================

@router.post(
    "/{team_id}/invite",
    response_model=TeamInvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invite Member to Team",
    description="Sends an invitation to a user email address to join the Team. Requires ADMIN or OWNER role.",
)
async def invite_member(
    team_id: uuid.UUID,
    payload: InviteMemberRequest,
    current_user: User = Depends(get_current_user),
    current_member: TeamMember = Depends(require_team_role(TeamRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> TeamInvitationResponse:
    repo = TeamRepository(db)
    team = await repo.get_by_id(team_id)
    if not team or team.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found.",
        )

    invitation = await MemberService.invite_member(
        team, payload.email, payload.role, current_user, db
    )
    return TeamInvitationResponse.model_validate(invitation)


@router.get(
    "/{team_id}/members",
    response_model=TeamMemberListResponse,
    summary="List Team Members",
    description="Returns paginated list of members in the team. Requires VIEWER role.",
)
async def list_members(
    team_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: Optional[str] = Query(default=None, description="Search username or email"),
    current_member: TeamMember = Depends(require_team_role(TeamRole.VIEWER)),
    db: AsyncSession = Depends(get_db),
) -> TeamMemberListResponse:
    data = await MemberService.get_team_members(
        team_id=team_id,
        page=page,
        page_size=page_size,
        search=search,
        db=db,
    )

    items_validated: list[TeamMemberResponse] = []
    for item in data["items"]:
        user_dict = {
            "id": str(item.user.id),
            "email": item.user.email,
            "username": item.user.username,
        } if item.user else None

        resp = TeamMemberResponse(
            id=item.id,
            team_id=item.team_id,
            user_id=item.user_id,
            role=item.role,
            status=item.status,
            joined_at=item.joined_at,
            user=user_dict,
        )
        items_validated.append(resp)

    return TeamMemberListResponse(
        items=items_validated,
        total_items=data["total_items"],
        page=data["page"],
        page_size=data["page_size"],
    )


@router.put(
    "/{team_id}/members/{member_id}/role",
    response_model=TeamMemberResponse,
    summary="Update Member Role",
    description="Updates a team member's RBAC role. Requires ADMIN or OWNER role.",
)
async def update_member_role(
    team_id: uuid.UUID,
    member_id: uuid.UUID,
    payload: UpdateMemberRoleRequest,
    current_member: TeamMember = Depends(require_team_role(TeamRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> TeamMemberResponse:
    repo = TeamRepository(db)
    team = await repo.get_by_id(team_id)
    if not team or team.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found.",
        )

    updated = await MemberService.update_member_role(
        team, member_id, payload.role, current_member, db
    )
    return TeamMemberResponse.model_validate(updated)


@router.delete(
    "/{team_id}/members/{member_id}",
    response_model=Dict[str, Any],
    summary="Remove Team Member",
    description="Removes a member from the team. Requires ADMIN or OWNER role.",
)
async def remove_member(
    team_id: uuid.UUID,
    member_id: uuid.UUID,
    current_member: TeamMember = Depends(require_team_role(TeamRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    repo = TeamRepository(db)
    team = await repo.get_by_id(team_id)
    if not team or team.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found.",
        )

    await MemberService.remove_member(team, member_id, current_member, db)
    return {
        "success": True,
        "message": f"Member '{member_id}' removed from team successfully.",
    }
