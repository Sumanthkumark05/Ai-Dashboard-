import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.repositories.base_repository import BaseRepository


class DocumentRepository(BaseRepository[Document]):
    """
    Document Data Access Repository.
    """

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Document, session)

    async def get_by_checksum(
        self, workspace_id: uuid.UUID, checksum: str
    ) -> Optional[Document]:
        """
        Find existing document matching checksum in the workspace.
        """
        query = select(Document).where(
            Document.workspace_id == workspace_id,
            Document.checksum == checksum,
            Document.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_workspace_documents(
        self,
        workspace_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fetch paginated workspace documents with search and filtering support.
        """
        page = max(1, page)
        page_size = max(1, page_size)
        skip = (page - 1) * page_size

        query = select(Document).where(
            Document.workspace_id == workspace_id,
            Document.is_deleted == False,  # noqa: E712
        )

        if category:
            query = query.where(Document.category == category.lower().strip())

        if status_filter:
            query = query.where(Document.status == status_filter.lower().strip())

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Document.title.ilike(search_pattern),
                    Document.description.ilike(search_pattern),
                    Document.file_name.ilike(search_pattern),
                )
            )

        # Count total matching
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.session.execute(count_query)
        total_items = total_result.scalar() or 0

        # Execute paginated query
        query = query.order_by(Document.created_at.desc()).offset(skip).limit(page_size)
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return {
            "items": items,
            "total_items": total_items,
            "page": page,
            "page_size": page_size,
        }

    async def count_workspace_documents(self, workspace_id: uuid.UUID) -> int:
        """
        Count active documents in a workspace.
        """
        query = select(func.count(Document.id)).where(
            Document.workspace_id == workspace_id,
            Document.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def sum_workspace_storage(self, workspace_id: uuid.UUID) -> int:
        """
        Sum total file storage in bytes for a workspace.
        """
        query = select(func.coalesce(func.sum(Document.file_size), 0)).where(
            Document.workspace_id == workspace_id,
            Document.is_deleted == False,  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalar() or 0

    async def get_document_versions(
        self, document_id: uuid.UUID
    ) -> List[DocumentVersion]:
        """
        Fetch version history for a document.
        """
        query = (
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .order_by(DocumentVersion.version_number.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
