import uuid
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import InvitationStatus, MemberStatus
from app.models.invitation import Invitation
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.repositories.invitation_repository import InvitationRepository
from app.repositories.organization_member_repository import OrganizationMemberRepository
from app.repositories.organization_repository import OrganizationRepository
from app.schemas.invitation import InvitationRequest


class InvitationService:
    """
    Business Logic Service managing multi-tenant organization invitations and acceptance.
    """

    @staticmethod
    async def invite_member(
        org_id: uuid.UUID, inviter: User, payload: InvitationRequest, db: AsyncSession
    ) -> Invitation:
        """
        Creates an organization invitation token for an email address.
        """
        inv_repo = InvitationRepository(db)
        member_repo = OrganizationMemberRepository(db)
        org_repo = OrganizationRepository(db)

        # 1. Verify organization exists and member limits
        org = await org_repo.get_by_id(org_id)
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found.",
            )

        current_member_count = await member_repo.count_members(org_id)
        if current_member_count >= org.member_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Organization has reached its member limit of {org.member_limit}.",
            )

        clean_email = payload.email.lower().strip()

        # 2. Check for duplicate pending invitation
        pending_inv = await inv_repo.get_pending_invitation(org_id, clean_email)
        if pending_inv:
            return pending_inv

        # 3. Create Invitation
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        invitation = await inv_repo.create(
            organization_id=org_id,
            email=clean_email,
            role=payload.role,
            token=token,
            expires_at=expires_at,
            status=InvitationStatus.PENDING,
            created_by=inviter.id,
        )

        logger.info(
            f"Invitation sent to '{clean_email}' for Organization ID {org_id} (Token: {token})"
        )
        return invitation

    @staticmethod
    async def accept_invitation(
        token: str, user: User, db: AsyncSession
    ) -> OrganizationMember:
        """
        Processes token acceptance and adds user to OrganizationMember table.
        """
        inv_repo = InvitationRepository(db)
        member_repo = OrganizationMemberRepository(db)

        invitation = await inv_repo.get_by_token(token)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired invitation token.",
            )

        # Ensure accepting user email matches invitation email
        if user.email.lower() != invitation.email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This invitation was sent to '{invitation.email}', but you are logged in as '{user.email}'.",
            )

        # Check if already a member
        existing_member = await member_repo.get_membership(
            invitation.organization_id, user.id
        )
        if existing_member:
            invitation.status = InvitationStatus.ACCEPTED
            invitation.accepted_at = datetime.now(timezone.utc)
            await db.commit()
            return existing_member

        # Create Organization Member
        member = await member_repo.create(
            organization_id=invitation.organization_id,
            user_id=user.id,
            role=invitation.role,
            status=MemberStatus.ACTIVE,
        )

        invitation.status = InvitationStatus.ACCEPTED
        invitation.accepted_at = datetime.now(timezone.utc)
        await db.commit()

        logger.info(f"User {user.email} accepted invitation to Org ID {invitation.organization_id}")
        return member

    @staticmethod
    async def reject_invitation(token: str, db: AsyncSession) -> bool:
        """
        Rejects an invitation token.
        """
        inv_repo = InvitationRepository(db)
        invitation = await inv_repo.get_by_token(token)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired invitation token.",
            )

        invitation.status = InvitationStatus.CANCELLED
        await db.commit()
        return True
