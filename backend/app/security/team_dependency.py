import uuid
from typing import Callable
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import TeamMemberStatus, TeamRole
from app.database.dependency import get_db
from app.models.team_member import TeamMember
from app.models.user import User
from app.repositories.team_member_repository import TeamMemberRepository
from app.security.dependencies import get_current_user
from app.services.permission_service import PermissionService


async def get_current_team_member(
    team_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamMember:
    """
    FastAPI dependency validating that current user is an active member of the target Team.
    """
    repo = TeamMemberRepository(db)
    member = await repo.get_member(team_id, current_user.id)
    if not member or member.status != TeamMemberStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not an active member of this Team.",
        )
    return member


def require_team_role(min_role: TeamRole) -> Callable:
    """
    Dependency factory checking that current user holds at least min_role in the target Team.
    """

    async def dependency(
        member: TeamMember = Depends(get_current_team_member),
    ) -> TeamMember:
        PermissionService.check_min_role(member.role, min_role)
        return member

    return dependency
