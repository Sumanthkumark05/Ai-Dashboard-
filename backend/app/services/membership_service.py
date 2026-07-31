import uuid
from typing import List
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import UserRole
from app.models.organization_member import OrganizationMember
from app.repositories.organization_member_repository import OrganizationMemberRepository


class MembershipService:
    """
    Business Logic Service managing tenant organization member roles and removals.
    """

    @staticmethod
    async def get_members(
        org_id: uuid.UUID, db: AsyncSession
    ) -> List[OrganizationMember]:
        """
        List active members of an organization.
        """
        member_repo = OrganizationMemberRepository(db)
        return await member_repo.get_organization_members(org_id)

    @staticmethod
    async def update_member_role(
        org_id: uuid.UUID,
        member_id: uuid.UUID,
        new_role: UserRole,
        db: AsyncSession,
    ) -> OrganizationMember:
        """
        Updates role for an organization member.
        Prevents removing or demoting the last OWNER.
        """
        member_repo = OrganizationMemberRepository(db)
        member = await member_repo.get_by_id(member_id)

        if not member or member.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization member record not found.",
            )

        # Prevent demoting owner if they are the only owner
        if member.role == UserRole.OWNER and new_role != UserRole.OWNER:
            all_members = await member_repo.get_organization_members(org_id)
            owner_count = sum(1 for m in all_members if m.role == UserRole.OWNER)
            if owner_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot demote the primary owner when they are the sole owner of the organization.",
                )

        updated_member = await member_repo.update(member_id, role=new_role)
        logger.info(
            f"Member ID {member_id} role updated to {new_role} in Organization ID {org_id}"
        )
        return updated_member

    @staticmethod
    async def remove_member(
        org_id: uuid.UUID, member_id: uuid.UUID, db: AsyncSession
    ) -> bool:
        """
        Removes a member from an organization.
        Prevents removing the sole OWNER.
        """
        member_repo = OrganizationMemberRepository(db)
        member = await member_repo.get_by_id(member_id)

        if not member or member.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization member record not found.",
            )

        if member.role == UserRole.OWNER:
            all_members = await member_repo.get_organization_members(org_id)
            owner_count = sum(1 for m in all_members if m.role == UserRole.OWNER)
            if owner_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the sole owner of an organization.",
                )

        return await member_repo.delete(member_id, soft=False)
