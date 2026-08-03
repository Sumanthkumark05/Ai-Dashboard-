import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, List, Union
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import InvitationStatus, TeamInvitationStatus, TeamMemberStatus
from app.models.invitation import Invitation
from app.models.organization_member import OrganizationMember
from app.models.team_invitation import TeamInvitation
from app.models.team_member import TeamMember
from app.models.user import User
from app.repositories.invitation_repository import InvitationRepository
from app.repositories.organization_member_repository import OrganizationMemberRepository
from app.repositories.team_invitation_repository import TeamInvitationRepository
from app.repositories.team_member_repository import TeamMemberRepository
from app.repositories.user_repository import UserRepository
from app.schemas.invitation import InvitationRequest
from app.services.activity_service import ActivityService
from app.services.email_hook_service import EmailHookService


class InvitationService:
    """
    Business Logic Service managing both Organization & Team invitation workflows.
    """

    @staticmethod
    async def invite_member(
        organization_id: uuid.UUID,
        inviter: User,
        payload: InvitationRequest,
        db: AsyncSession,
    ) -> Invitation:
        """
        Invites a user to an Organization (Module 6 compatibility).
        """
        inv_repo = InvitationRepository(db)
        member_repo = OrganizationMemberRepository(db)
        user_repo = UserRepository(db)

        clean_email = payload.email.lower().strip()
        target_user = await user_repo.get_by_email(clean_email)
        if target_user:
            existing = await member_repo.get_membership(organization_id, target_user.id)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"User '{clean_email}' is already a member of this organization.",
                )


        token = uuid.uuid4().hex
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        invitation = await inv_repo.create(
            organization_id=organization_id,
            email=clean_email,
            role=payload.role,
            token=token,
            expires_at=expires_at,
            created_by=inviter.id,
            status=InvitationStatus.PENDING,
        )
        await db.commit()
        await db.refresh(invitation)
        return invitation

    @staticmethod
    async def accept_invitation(
        token: str, accepting_user: User, db: AsyncSession
    ) -> Union[OrganizationMember, TeamMember]:
        """
        Accepts an Organization or Team invitation token.
        """
        now = datetime.now(timezone.utc)

        # 1. Check Organization Invitation
        org_inv_repo = InvitationRepository(db)
        org_inv = await org_inv_repo.get_by_token(token)

        if org_inv:
            if org_inv.email.lower() != accepting_user.email.lower():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invitation email does not match your current user account email.",
                )
            if org_inv.status != InvitationStatus.PENDING:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This organization invitation is no longer active.",
                )

            # Add to Organization
            org_member_repo = OrganizationMemberRepository(db)
            member = await org_member_repo.create(
                organization_id=org_inv.organization_id,
                user_id=accepting_user.id,
                role=org_inv.role,
            )

            org_inv.status = InvitationStatus.ACCEPTED
            org_inv.accepted_at = now
            db.add(org_inv)
            await db.commit()
            await db.refresh(member)
            return member

        # 2. Check Team Invitation
        team_inv_repo = TeamInvitationRepository(db)
        team_inv = await team_inv_repo.get_by_token(token)

        if team_inv:
            if team_inv.email.lower() != accepting_user.email.lower():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invitation email does not match your current user account email.",
                )
            if team_inv.accepted or team_inv.status == TeamInvitationStatus.ACCEPTED:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This team invitation token has already been accepted.",
                )

            expires_at = team_inv.expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)

            if expires_at < now:
                team_inv.status = TeamInvitationStatus.EXPIRED
                db.add(team_inv)
                await db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This invitation token has expired.",
                )


            team_member_repo = TeamMemberRepository(db)
            existing_member = await team_member_repo.get_member(team_inv.team_id, accepting_user.id)
            if existing_member:
                existing_member.role = team_inv.role
                existing_member.status = TeamMemberStatus.ACTIVE
                existing_member.joined_at = now
                team_member = existing_member
            else:
                team_member = TeamMember(
                    team_id=team_inv.team_id,
                    user_id=accepting_user.id,
                    role=team_inv.role,
                    status=TeamMemberStatus.ACTIVE,
                    joined_at=now,
                )

            db.add(team_member)
            team_inv.status = TeamInvitationStatus.ACCEPTED
            team_inv.accepted = True
            db.add(team_inv)

            await db.commit()
            await db.refresh(team_member)

            await ActivityService.log_activity(
                user_id=accepting_user.id,
                action="ACCEPT_TEAM_INVITATION",
                details={"team_id": str(team_inv.team_id), "token": token},
            )

            team_name = team_inv.team.name if team_inv.team else "Team"
            await EmailHookService.send_invitation_accepted(
                email=accepting_user.email, team_name=team_name
            )
            return team_member

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation token not found.",
        )

    @staticmethod
    async def reject_invitation(
        token: str, rejecting_user: User, db: AsyncSession
    ) -> Any:
        """
        Rejects an Organization or Team invitation token.
        """
        org_inv_repo = InvitationRepository(db)
        org_inv = await org_inv_repo.get_by_token(token)

        if org_inv:
            if org_inv.email.lower() != rejecting_user.email.lower():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invitation email does not match your current user account email.",
                )
            org_inv.status = InvitationStatus.REJECTED
            db.add(org_inv)
            await db.commit()
            await db.refresh(org_inv)
            return org_inv

        team_inv_repo = TeamInvitationRepository(db)
        team_inv = await team_inv_repo.get_by_token(token)

        if team_inv:
            if team_inv.email.lower() != rejecting_user.email.lower():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invitation email does not match your current user account email.",
                )
            team_inv.status = TeamInvitationStatus.REJECTED
            db.add(team_inv)
            await db.commit()
            await db.refresh(team_inv)
            return team_inv

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation token not found.",
        )

    @staticmethod
    async def get_user_invitations(
        user: User, db: AsyncSession
    ) -> List[TeamInvitation]:
        """
        Fetch all pending team invitations for the current user.
        """
        team_inv_repo = TeamInvitationRepository(db)
        return await team_inv_repo.get_user_invitations(user.email)
