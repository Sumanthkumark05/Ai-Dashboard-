import uuid
from typing import Any, List
from fastapi import HTTPException, status
from app.core.constants import TeamRole
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_repository import RoleRepository


class PermissionService:
    """
    RBAC Permission Logic managing system roles, permissions, and Team RBAC validations.
    """

    # Module 5 System Role & Permission Methods
    @staticmethod
    async def get_roles(repo: RoleRepository) -> List[Any]:
        return await repo.get_all()

    @staticmethod
    async def get_role_by_id(role_id: uuid.UUID, repo: RoleRepository) -> Any:
        role = await repo.get_by_id(role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )
        return role

    @staticmethod
    async def get_permissions(repo: PermissionRepository) -> List[Any]:
        return await repo.get_all()

    # Module 11 Team RBAC Validation Logic
    ROLE_HIERARCHY = {
        TeamRole.OWNER: 4,
        TeamRole.ADMIN: 3,
        TeamRole.EDITOR: 2,
        TeamRole.VIEWER: 1,
    }

    @classmethod
    def check_min_role(cls, current_role: TeamRole, required_role: TeamRole) -> None:
        """
        Validates that current user holds at least the required role weight.
        """
        if cls.ROLE_HIERARCHY.get(current_role, 0) < cls.ROLE_HIERARCHY.get(required_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required team role: '{required_role.value}'. Current role: '{current_role.value}'.",
            )

    @classmethod
    def can_manage_member(
        cls, operator_role: TeamRole, target_role: TeamRole, new_role: TeamRole = None
    ) -> None:
        """
        Enforces business rules for role assignments & member management:
        - Admins cannot modify Owner
        - Admins cannot promote anyone to Owner or Admin (only Owner can create Admins/Owners)
        - Owner cannot demote himself
        """
        if target_role == TeamRole.OWNER and operator_role != TeamRole.OWNER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Team Owner can modify or remove the Owner.",
            )

        if new_role:
            if new_role == TeamRole.OWNER and operator_role != TeamRole.OWNER:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only Team Owner can assign the OWNER role.",
                )

            if new_role == TeamRole.ADMIN and operator_role != TeamRole.OWNER:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only Team Owner can promote members to ADMIN.",
                )
