from typing import List, Optional
from app.models.permission import Permission
from app.models.role import Role
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_repository import RoleRepository


class PermissionService:
    """
    Business Service for inspecting system roles and fine-grained permissions.
    """

    @staticmethod
    async def get_roles(repo: RoleRepository) -> List[Role]:
        """Fetch all system roles."""
        return await repo.get_all()

    @staticmethod
    async def get_role_by_id(role_id: str, repo: RoleRepository) -> Optional[Role]:
        """Fetch specific role by ID."""
        return await repo.get_by_id(role_id)

    @staticmethod
    async def get_permissions(repo: PermissionRepository) -> List[Permission]:
        """Fetch all fine-grained permissions."""
        return await repo.get_all()

    @staticmethod
    async def get_permission_by_id(
        perm_id: str, repo: PermissionRepository
    ) -> Optional[Permission]:
        """Fetch specific permission by ID."""
        return await repo.get_by_id(perm_id)
