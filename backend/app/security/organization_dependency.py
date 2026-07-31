import uuid
from typing import Callable, List, Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import UserRole
from app.database.dependency import get_db
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.repositories.organization_member_repository import OrganizationMemberRepository
from app.repositories.organization_repository import OrganizationRepository
from app.security.dependencies import get_current_user


async def get_current_organization(
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Organization:
    """
    FastAPI Dependency establishing multi-tenant Organization context.
    Inspects 'X-Organization-ID' header or defaults to user's first organization.
    """
    member_repo = OrganizationMemberRepository(db)
    org_repo = OrganizationRepository(db)

    # 1. Fetch user active organizations
    user_orgs = await member_repo.get_user_organizations(current_user.id)
    if not user_orgs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User does not belong to any active organization.",
        )

    # 2. Target Organization ID matching
    target_org: Optional[Organization] = None
    if x_organization_id:
        try:
            target_uuid = uuid.UUID(x_organization_id)
            target_org = next((o for o in user_orgs if o.id == target_uuid), None)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid X-Organization-ID header format.",
            )

        if not target_org:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not an active member of the specified organization.",
            )
    else:
        # Default to first organization context
        target_org = user_orgs[0]

    return target_org


def require_organization_role(allowed_roles: List[UserRole]) -> Callable:
    """
    Dependency factory verifying member role within current organization context.
    """

    async def role_checker(
        current_org: Organization = Depends(get_current_organization),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> OrganizationMember:
        if current_user.is_superuser:
            # Create synthetic member context for superusers
            return OrganizationMember(
                organization_id=current_org.id,
                user_id=current_user.id,
                role=UserRole.SUPER_ADMIN,
            )

        member_repo = OrganizationMemberRepository(db)
        member = await member_repo.get_membership(current_org.id, current_user.id)

        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not an active member of this organization.",
            )

        member_role_str = (
            member.role.value if hasattr(member.role, "value") else str(member.role)
        )
        allowed_role_strs = [
            r.value if hasattr(r, "value") else str(r) for r in allowed_roles
        ]

        if member_role_str not in allowed_role_strs:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires organization role: {[r.value for r in allowed_roles]}",
            )

        return member

    return role_checker
