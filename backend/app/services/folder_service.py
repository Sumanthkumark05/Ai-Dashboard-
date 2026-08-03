import uuid
from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.folder import Folder
from app.models.user import User
from app.repositories.folder_repository import FolderRepository
from app.schemas.folder import CreateFolderRequest, UpdateFolderRequest


class FolderService:
    """
    Business Logic Service managing Folder creation, nesting, metadata updates, and deletion.
    """

    @staticmethod
    async def create_folder(
        workspace_id: uuid.UUID,
        payload: CreateFolderRequest,
        creator: User,
        db: AsyncSession,
    ) -> Folder:
        """
        Creates a folder or subfolder inside a workspace.
        """
        folder_repo = FolderRepository(db)

        # Check folder name uniqueness inside parent
        existing = await folder_repo.get_by_name(
            workspace_id=workspace_id,
            name=payload.name,
            parent_folder_id=payload.parent_folder_id,
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A folder named '{payload.name}' already exists in this location.",
            )

        parent_path = ""
        if payload.parent_folder_id:
            parent = await folder_repo.get_by_id(payload.parent_folder_id)
            if not parent or parent.workspace_id != workspace_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent folder not found.",
                )
            parent_path = parent.path

        folder_path = f"{parent_path}/{payload.name.strip()}"

        folder = await folder_repo.create(
            workspace_id=workspace_id,
            parent_folder_id=payload.parent_folder_id,
            name=payload.name.strip(),
            path=folder_path,
            created_by=creator.id,
        )
        await db.commit()
        await db.refresh(folder)

        logger.info(f"Folder '{folder.name}' created in Workspace ID {workspace_id}")
        return folder

    @staticmethod
    async def update_folder(
        folder_id: uuid.UUID, payload: UpdateFolderRequest, db: AsyncSession
    ) -> Folder:
        """
        Updates a folder's name and path.
        """
        folder_repo = FolderRepository(db)
        folder = await folder_repo.get_by_id(folder_id)
        if not folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found.",
            )

        new_name = payload.name.strip()
        parent_path = "/".join(folder.path.split("/")[:-1])
        folder.name = new_name
        folder.path = f"{parent_path}/{new_name}"

        db.add(folder)
        await db.commit()
        await db.refresh(folder)
        return folder

    @staticmethod
    async def delete_folder(folder_id: uuid.UUID, db: AsyncSession) -> bool:
        """
        Deletes a folder and all contents inside.
        """
        folder_repo = FolderRepository(db)
        success = await folder_repo.delete(folder_id, soft=False)
        logger.info(f"Folder ID {folder_id} deleted.")
        return success

    @staticmethod
    async def get_workspace_folders(
        workspace_id: uuid.UUID,
        parent_folder_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        db: AsyncSession = None,
    ) -> Dict[str, Any]:
        """
        Fetch paginated workspace folders.
        """
        folder_repo = FolderRepository(db)
        return await folder_repo.get_workspace_folders(
            workspace_id=workspace_id,
            parent_folder_id=parent_folder_id,
            page=page,
            page_size=page_size,
            search=search,
        )
