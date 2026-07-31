import re
import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import MemberStatus, UserRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.repositories.organization_member_repository import OrganizationMemberRepository
from app.repositories.organization_repository import OrganizationRepository
from app.schemas.organization import CreateOrganizationRequest, UpdateOrganizationRequest


class OrganizationService:
    """
    Business Logic Service managing tenant Organization lifecycle, slug generation, and creation.
    """

    @staticmethod
    def generate_slug(name: str) -> str:
        """
        Generates URL-friendly slug from organization name.
        Example: "OpenAI Research" -> "openai-research"
        """
        slug = name.lower().strip()
        slug = re.sub(r"[^\w\s-]", "", slug)
        slug = re.sub(r"[\s_-]+", "-", slug)
        return slug.strip("-")

    @staticmethod
    async def create_organization(
        payload: CreateOrganizationRequest, creator: User, db: AsyncSession
    ) -> Organization:
        """
        Creates an Organization, assigns creator as OWNER member.
        """
        org_repo = OrganizationRepository(db)
        member_repo = OrganizationMemberRepository(db)

        # 1. Slug handling & uniqueness
        base_slug = payload.slug or OrganizationService.generate_slug(payload.name)
        slug = base_slug
        counter = 1
        while await org_repo.slug_exists(slug):
            slug = f"{base_slug}-{counter}"
            counter += 1

        # 2. Create Organization
        org = await org_repo.create(
            name=payload.name,
            slug=slug,
            description=payload.description,
            logo_url=payload.logo_url,
            website=payload.website,
            industry=payload.industry,
            country=payload.country,
            timezone=payload.timezone,
            created_by=creator.id,
        )

        # 3. Add Creator as OWNER Member
        await member_repo.create(
            organization_id=org.id,
            user_id=creator.id,
            role=UserRole.OWNER,
            status=MemberStatus.ACTIVE,
        )

        logger.info(f"Organization '{org.name}' ({org.slug}) created by User ID: {creator.id}")
        return org

    @staticmethod
    async def update_organization(
        org_id: uuid.UUID, payload: UpdateOrganizationRequest, db: AsyncSession
    ) -> Organization:
        """
        Updates organization details.
        """
        org_repo = OrganizationRepository(db)
        update_data = payload.model_dump(exclude_unset=True)

        updated_org = await org_repo.update(org_id, **update_data)
        if not updated_org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found.",
            )
        return updated_org

    @staticmethod
    async def soft_delete_organization(org_id: uuid.UUID, db: AsyncSession) -> bool:
        """
        Soft deletes an organization.
        """
        org_repo = OrganizationRepository(db)
        return await org_repo.delete(org_id, soft=True)

    @staticmethod
    async def get_user_organizations(
        user_id: uuid.UUID, db: AsyncSession
    ) -> List[Organization]:
        """
        Retrieves all active organizations where user is an active member.
        """
        member_repo = OrganizationMemberRepository(db)
        return await member_repo.get_user_organizations(user_id)
