from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.user import User
from app.schemas.invitation import AcceptInvitationRequest, RejectInvitationRequest
from app.schemas.organization_member import MemberResponse
from app.security.dependencies import get_current_user
from app.services.invitation_service import InvitationService

router = APIRouter(prefix="/invitations", tags=["Organization Invitations"])


@router.post(
    "/accept",
    response_model=MemberResponse,
    summary="Accept Organization Invitation",
    description="Accepts an organization invitation via token and joins user to organization.",
)
async def accept_invitation(
    payload: AcceptInvitationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MemberResponse:
    member = await InvitationService.accept_invitation(payload.token, current_user, db)
    return MemberResponse.model_validate(member)


@router.post(
    "/reject",
    response_model=Dict[str, Any],
    summary="Reject Organization Invitation",
    description="Rejects an organization invitation token.",
)
async def reject_invitation(
    payload: RejectInvitationRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    await InvitationService.reject_invitation(payload.token, db)
    return {
        "success": True,
        "message": "Invitation rejected successfully.",
    }
