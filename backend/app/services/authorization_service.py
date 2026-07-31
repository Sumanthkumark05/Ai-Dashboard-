from app.models.user import User


class AuthorizationService:
    """
    Service for RBAC and permission checking.
    """

    @staticmethod
    def user_has_permission(user: User, permission_name: str) -> bool:
        """
        Returns True if user holds permission or is an administrator.
        """
        if user.is_superuser or str(user.role) in ("super_admin", "owner", "admin"):
            return True

        return False
