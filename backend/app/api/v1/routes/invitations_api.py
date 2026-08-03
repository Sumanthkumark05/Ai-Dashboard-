from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.user import User
from app.schemas.invitation import TeamInvitationListResponse, TeamInvitationResponse
from app.schemas.member import TeamMemberResponse
from app.security.dependencies import get_current_user
from app.services.invitation_service import InvitationService

router = APIRouter(prefix="/invitations", tags=["Team Invitations"])


@router.get(
    "",
    response_model=TeamInvitationListResponse,
    summary="List Pending Invitations",
    description="Returns list of active pending team invitations for the currently authenticated user email.",
)
async def list_pending_invitations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamInvitationListResponse:
    invitations = await InvitationService.get_user_invitations(current_user, db)
    items = [TeamInvitationResponse.model_validate(inv) for inv in invitations]
    return TeamInvitationListResponse(items=items, total_items=len(items))


@router.post(
    "/{token}/accept",
    response_model=TeamMemberResponse,
    summary="Accept Team Invitation",
    description="Accepts a pending team invitation token and joins the Team.",
)
async def accept_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamMemberResponse:
    member = await InvitationService.accept_invitation(token, current_user, db)
    user_dict = {
        "id": str(accepting_user.id),
        "email": accepting_user.email,
        "username": accepting_user.username,
    } if (accepting_user := current_user) else None

    return TeamMemberResponse(
        id=member.id,
        team_id=member.team_id,
        user_id=member.user_id,
        role=member.role,
        status=member.status,
        joined_at=member.joined_at,
        user=user_dict,
    )


@router.post(
    "/{token}/reject",
    response_model=TeamInvitationResponse,
    summary="Reject Team Invitation",
    description="Rejects a pending team invitation token.",
)
async def reject_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamInvitationResponse:
    invitation = await InvitationService.reject_invitation(token, current_user, db)
    return TeamInvitationResponse.model_validate(invitation)
