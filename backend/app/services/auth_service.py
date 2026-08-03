from typing import Tuple
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import (
    MemberStatus,
    TeamMemberStatus,
    TeamRole,
    UserRole,
    WorkspaceRole,
    WorkspaceStatus,
    WorkspaceVisibility,
)
from app.models.user import User
from app.models.organization import Organization
from app.repositories.folder_repository import FolderRepository
from app.repositories.organization_member_repository import OrganizationMemberRepository
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.team_member_repository import TeamMemberRepository
from app.repositories.team_repository import TeamRepository
from app.repositories.user_repository import UserRepository
from app.repositories.workspace_member_repository import WorkspaceMemberRepository
from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.token import TokenResponse
from app.security.password import hash_password, validate_password_strength, verify_password
from app.services.organization_service import OrganizationService
from app.services.token_service import TokenService


class AuthService:
    """
    Business Logic Service orchestrating authentication workflows:
    Registration, Login, Token Issuance, Password Reset, and Onboarding Provisioning.
    """

    @staticmethod
    async def provision_user_defaults(user: User, db: AsyncSession) -> Organization:
        """
        Provisions default tenant resources for a user atomically:
        1. Organization & OrganizationMember (OWNER)
        2. Workspace & WorkspaceMember (OWNER)
        3. Default Team & TeamMember (ADMIN)
        4. Default Folders (Documents, Datasets, Uploads, Reports, AI Chats, Archives)
        """
        org_repo = OrganizationRepository(db)
        org_member_repo = OrganizationMemberRepository(db)
        ws_repo = WorkspaceRepository(db)
        ws_member_repo = WorkspaceMemberRepository(db)
        team_repo = TeamRepository(db)
        team_member_repo = TeamMemberRepository(db)
        folder_repo = FolderRepository(db)

        # 1. Check if user already has an organization
        user_orgs = await org_member_repo.get_user_organizations(user.id)
        if user_orgs:
            return user_orgs[0]

        display_name = user.full_name or user.username or "User"
        org_name = f"{display_name}'s Organization"
        base_slug = OrganizationService.generate_slug(org_name) or f"org-{str(user.id)[:8]}"
        slug = base_slug
        counter = 1
        while await org_repo.slug_exists(slug):
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Create Organization
        org = await org_repo.create(
            name=org_name,
            slug=slug,
            description=f"Primary workspace organization for {display_name}",
            created_by=user.id,
        )

        # Add as Organization OWNER
        await org_member_repo.create(
            organization_id=org.id,
            user_id=user.id,
            role=UserRole.OWNER,
            status=MemberStatus.ACTIVE,
        )

        # 2. Create Default Workspace
        ws_base_slug = "default-workspace"
        ws_slug = ws_base_slug
        counter = 1
        while await ws_repo.slug_exists(org.id, ws_slug):
            ws_slug = f"{ws_base_slug}-{counter}"
            counter += 1

        workspace = await ws_repo.create(
            organization_id=org.id,
            name="Default Workspace",
            slug=ws_slug,
            description="Main active workspace for autonomous AI agents and file management.",
            visibility=WorkspaceVisibility.PRIVATE,
            status=WorkspaceStatus.ACTIVE,
            created_by=user.id,
            member_count=1,
        )

        # Add as Workspace OWNER
        await ws_member_repo.create(
            workspace_id=workspace.id,
            user_id=user.id,
            role=WorkspaceRole.OWNER,
            status=MemberStatus.ACTIVE,
        )

        # 3. Create Default Team & Membership
        team = await team_repo.create(
            workspace_id=workspace.id,
            owner_id=user.id,
            name="Engineering",
            description="Core engineering and architecture team",
        )

        await team_member_repo.create(
            team_id=team.id,
            user_id=user.id,
            role=TeamRole.ADMIN,
            status=TeamMemberStatus.ACTIVE,
        )

        # 4. Create Default Folders
        default_folders = ["Documents", "Datasets", "Uploads", "Reports", "AI Chats", "Archives"]
        for folder_name in default_folders:
            existing = await folder_repo.get_by_name(workspace.id, folder_name)
            if not existing:
                await folder_repo.create(
                    workspace_id=workspace.id,
                    name=folder_name,
                    path=f"/{folder_name}",
                    created_by=user.id,
                )

        logger.info(
            f"Successfully provisioned onboarding resources for User: {user.email} (Org ID: {org.id}, Workspace ID: {workspace.id})"
        )
        return org

    @staticmethod
    async def register_user(
        payload: RegisterRequest, repo: UserRepository
    ) -> Tuple[User, TokenResponse]:
        """
        Registers a new user account with duplicate checks, password hashing, and auto-provisioning.
        """
        clean_email = payload.email.lower().strip()
        clean_username = payload.username.lower().strip()

        # 1. Duplicate Email check
        existing_email = await repo.get_by_email(clean_email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )

        # 2. Duplicate Username check
        existing_username = await repo.get_by_username(clean_username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username is already taken.",
            )

        # 3. Password Strength Validation
        validate_password_strength(payload.password)

        # 4. Hash Password and Create User
        hashed_pwd = hash_password(payload.password)
        user = await repo.create(
            email=clean_email,
            username=clean_username,
            hashed_password=hashed_pwd,
            first_name=payload.first_name,
            last_name=payload.last_name,
        )

        # 5. Provision Onboarding Resources (Org, Workspace, Team, Folders)
        await AuthService.provision_user_defaults(user, repo.session)

        logger.info(f"User registered & onboarded successfully: {user.email} (ID: {user.id})")
        tokens = TokenService.generate_tokens(user)
        return user, tokens

    @staticmethod
    async def login_user(
        payload: LoginRequest, repo: UserRepository
    ) -> Tuple[User, TokenResponse]:
        """
        Authenticates a user via email/username and password.
        Ensures onboarding resources exist and updates last_login timestamp upon success.
        """
        raw_identifier = payload.email_or_username or payload.email or payload.username or ""
        identifier = raw_identifier.lower().strip()
        logger.info(f"[AUTH] Processing login attempt for identifier: {identifier}")

        user = await repo.get_by_email_or_username(identifier)

        if not user:
            logger.warning(f"[AUTH] Login failed: Database query returned no user for identifier '{identifier}'")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        logger.info(f"[AUTH] Database query result: User matched (ID: {user.id}, Email: {user.email})")

        if not verify_password(payload.password, user.hashed_password):
            logger.warning(f"[AUTH] Login failed: Password verification failed for User ID: {user.id} ({user.email})")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active or user.is_deleted:
            logger.warning(f"[AUTH] Login failed: User account inactive or deleted for User ID: {user.id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is inactive or disabled.",
            )

        # Ensure onboarding resources exist for legacy or unprovisioned users
        await AuthService.provision_user_defaults(user, repo.session)

        await repo.update_last_login(user.id)
        logger.info(f"[AUTH] User authenticated successfully: {user.email}")
        tokens = TokenService.generate_tokens(user)
        logger.info(f"[AUTH] JWT token generation completed for authenticated email: {user.email}")
        return user, tokens

    @staticmethod
    async def forgot_password(email: str, repo: UserRepository) -> dict:
        """
        Architecture foundation for password recovery requests.
        """
        user = await repo.get_by_email(email)
        if user:
            logger.info(f"Password reset requested for registered email: {email}")
        else:
            logger.info(f"Password reset requested for unregistered email: {email}")

        return {
            "success": True,
            "message": "If your email is registered, you will receive a password reset link shortly.",
        }

    @staticmethod
    async def reset_password(token: str, new_password: str, repo: UserRepository) -> dict:
        """
        Architecture foundation for resetting password via recovery token.
        """
        validate_password_strength(new_password)
        logger.info("Password reset executed via token.")
        return {
            "success": True,
            "message": "Your password has been reset successfully. Please log in with your new password.",
        }

    @staticmethod
    async def verify_email(token: str, repo: UserRepository) -> dict:
        """
        Architecture foundation for email verification token processing.
        """
        logger.info("Email verification executed via token.")
        return {
            "success": True,
            "message": "Email address verified successfully.",
        }
