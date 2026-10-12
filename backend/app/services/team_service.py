import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import TeamMemberStatus, TeamRole
from app.models.team import Team
from app.models.team_member import TeamMember
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.team_member_repository import TeamMemberRepository
from app.repositories.team_repository import TeamRepository
from app.schemas.team import CreateTeamRequest, UpdateTeamRequest
from app.services.activity_service import ActivityService
from app.services.email_hook_service import EmailHookService


class TeamService:
    """
    Business Logic Service managing Team creation, metadata updates, deletion, and ownership transfer.
    """

    @staticmethod
    async def create_team(
        workspace: Workspace,
        payload: CreateTeamRequest,
        creator: User,
        db: AsyncSession,
    ) -> Team:
        """
        Creates a new Team inside a Workspace and assigns creator as OWNER.
        """
        team_repo = TeamRepository(db)

        # Check unique team name in workspace
        existing = await team_repo.get_by_name(workspace.id, payload.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A team named '{payload.name}' already exists in this workspace.",
            )

        # 1. Create Team
        team = await team_repo.create(
            workspace_id=workspace.id,
            owner_id=creator.id,
            name=payload.name,
            description=payload.description,
            avatar=payload.avatar,
        )

        # 2. Add creator as OWNER member
        owner_member = TeamMember(
            team_id=team.id,
            user_id=creator.id,
            role=TeamRole.OWNER,
            status=TeamMemberStatus.ACTIVE,
            joined_at=datetime.now(timezone.utc),
        )
        db.add(owner_member)
        await db.commit()
        await db.refresh(team)

        await ActivityService.log_activity(
            user_id=creator.id,
            action="CREATE_TEAM",
            details={"team_id": str(team.id), "team_name": team.name},
        )
        logger.info(f"Team '{team.name}' created in Workspace ID {workspace.id} by User ID {creator.id}")
        return team

    @staticmethod
    async def update_team(
        team_id: uuid.UUID, payload: UpdateTeamRequest, db: AsyncSession
    ) -> Team:
        """
        Updates team metadata.
        """
        team_repo = TeamRepository(db)
        update_data = payload.model_dump(exclude_unset=True)

        updated_team = await team_repo.update(team_id, **update_data)
        if not updated_team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found.",
            )
        await db.refresh(updated_team)
        logger.info(f"Team ID {team_id} metadata updated.")
        return updated_team

    @staticmethod
    async def delete_team(team_id: uuid.UUID, db: AsyncSession) -> bool:
        """
        Soft deletes a team.
        """
        team_repo = TeamRepository(db)
        success = await team_repo.delete(team_id, soft=True)
        logger.info(f"Team ID {team_id} soft deleted.")
        return success

    @staticmethod
    async def transfer_ownership(
        team: Team, new_owner_id: uuid.UUID, current_owner: User, db: AsyncSession
    ) -> Team:
        """
        Transfers team ownership to another active team member.
        """
        if team.owner_id == new_owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target user is already the Team Owner.",
            )

        member_repo = TeamMemberRepository(db)
        new_owner_member = await member_repo.get_member(team.id, new_owner_id)
        if not new_owner_member or new_owner_member.status != TeamMemberStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot transfer ownership to a non-member. User must be an active team member.",
            )

        # Fetch current owner member
        old_owner_member = await member_repo.get_member(team.id, current_owner.id)

        # Transfer ownership
        team.owner_id = new_owner_id
        db.add(team)

        # Update member roles
        new_owner_member.role = TeamRole.OWNER
        db.add(new_owner_member)

        if old_owner_member:
            old_owner_member.role = TeamRole.ADMIN
            db.add(old_owner_member)

        await db.commit()
        await db.refresh(team)

        await ActivityService.log_activity(
            user_id=current_owner.id,
            action="TRANSFER_TEAM_OWNERSHIP",
            details={"team_id": str(team.id), "new_owner_id": str(new_owner_id)},
        )

        await EmailHookService.send_owner_transfer(
            old_owner_email=current_owner.email,
            new_owner_email=new_owner_member.user.email if new_owner_member.user else str(new_owner_id),
            team_name=team.name,
        )

        logger.info(f"Team ID {team.id} ownership transferred to User ID {new_owner_id}")
        return team

    @staticmethod
    async def get_workspace_teams(
        workspace_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        db: AsyncSession = None,
    ) -> Dict[str, Any]:
        """
        Fetch paginated workspace teams.
        """
        team_repo = TeamRepository(db)
        return await team_repo.get_workspace_teams(
            workspace_id=workspace_id,
            page=page,
            page_size=page_size,
            search=search,
        )
