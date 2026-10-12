import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import TeamInvitationStatus, TeamMemberStatus, TeamRole
from app.models.team import Team
from app.models.team_invitation import TeamInvitation
from app.models.team_member import TeamMember
from app.models.user import User
from app.repositories.team_invitation_repository import TeamInvitationRepository
from app.repositories.team_member_repository import TeamMemberRepository
from app.repositories.user_repository import UserRepository
from app.services.activity_service import ActivityService
from app.services.email_hook_service import EmailHookService
from app.services.permission_service import PermissionService


class MemberService:
    """
    Business Logic Service managing Team memberships, role assignments, removals, and invitations.
    """

    @staticmethod
    async def invite_member(
        team: Team,
        email: str,
        role: TeamRole,
        inviter: User,
        db: AsyncSession,
    ) -> TeamInvitation:
        """
        Invites a user by email to join a Team.
        """
        clean_email = email.lower().strip()
        inv_repo = TeamInvitationRepository(db)
        user_repo = UserRepository(db)
        member_repo = TeamMemberRepository(db)

        # 1. Check if recipient is already a registered user and active member
        target_user = await user_repo.get_by_email(clean_email)
        if target_user:
            existing_member = await member_repo.get_member(team.id, target_user.id)
            if existing_member and existing_member.status == TeamMemberStatus.ACTIVE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"User with email '{clean_email}' is already an active member of this team.",
                )

        # 2. Check duplicate active invitation
        active_inv = await inv_repo.get_active_invitation(team.id, clean_email)
        if active_inv:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An active invitation for '{clean_email}' already exists in this team.",
            )

        # 3. Create Invitation Record
        token = uuid.uuid4().hex
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        invitation = await inv_repo.create(
            team_id=team.id,
            email=clean_email,
            token=token,
            role=role,
            status=TeamInvitationStatus.PENDING,
            expires_at=expires_at,
            accepted=False,
        )

        await ActivityService.log_activity(
            user_id=inviter.id,
            action="INVITE_TEAM_MEMBER",
            details={"team_id": str(team.id), "email": clean_email, "role": role.value},
        )

        await EmailHookService.send_team_invitation(
            email=clean_email,
            team_name=team.name,
            token=token,
            role=role.value,
        )

        logger.info(f"Invitation created for '{clean_email}' to join Team '{team.name}'")
        return invitation

    @staticmethod
    async def update_member_role(
        team: Team,
        member_id: uuid.UUID,
        new_role: TeamRole,
        operator_member: TeamMember,
        db: AsyncSession,
    ) -> TeamMember:
        """
        Updates a team member's RBAC role.
        """
        member_repo = TeamMemberRepository(db)
        target_member = await member_repo.get_by_id(member_id)

        if not target_member or target_member.team_id != team.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team member not found.",
            )

        # Enforce RBAC rules
        PermissionService.can_manage_member(
            operator_role=operator_member.role,
            target_role=target_member.role,
            new_role=new_role,
        )

        target_member.role = new_role
        db.add(target_member)
        await db.commit()
        await db.refresh(target_member)

        await ActivityService.log_activity(
            user_id=operator_member.user_id,
            action="UPDATE_MEMBER_ROLE",
            details={"team_id": str(team.id), "member_id": str(member_id), "new_role": new_role.value},
        )

        logger.info(f"Team Member ID {member_id} role updated to '{new_role.value}'")
        return target_member

    @staticmethod
    async def remove_member(
        team: Team,
        member_id: uuid.UUID,
        operator_member: TeamMember,
        db: AsyncSession,
    ) -> bool:
        """
        Removes a member from a Team.
        """
        member_repo = TeamMemberRepository(db)
        target_member = await member_repo.get_by_id(member_id)

        if not target_member or target_member.team_id != team.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team member not found.",
            )

        # Owner protection
        if target_member.role == TeamRole.OWNER or target_member.user_id == team.owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team Owner cannot be removed from the team.",
            )

        PermissionService.can_manage_member(
            operator_role=operator_member.role,
            target_role=target_member.role,
        )

        # Soft delete / update status to REMOVED
        target_member.status = TeamMemberStatus.REMOVED
        db.add(target_member)
        await db.commit()

        await ActivityService.log_activity(
            user_id=operator_member.user_id,
            action="REMOVE_TEAM_MEMBER",
            details={"team_id": str(team.id), "removed_user_id": str(target_member.user_id)},
        )

        if target_member.user and target_member.user.email:
            await EmailHookService.send_member_removed(
                email=target_member.user.email,
                team_name=team.name,
            )

        logger.info(f"Member ID {member_id} removed from Team ID {team.id}")
        return True

    @staticmethod
    async def get_team_members(
        team_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        db: AsyncSession = None,
    ) -> Dict[str, Any]:
        """
        Fetch paginated team members.
        """
        member_repo = TeamMemberRepository(db)
        return await member_repo.get_team_members(
            team_id=team_id,
            page=page,
            page_size=page_size,
            search=search,
        )
