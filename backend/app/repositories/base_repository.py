import math
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Abstract Generic Repository implementing standard CRUD and pagination methods.
    Future entity repositories will inherit from this class.
    """

    def __init__(self, model: Type[ModelType], session: AsyncSession) -> None:
        self.model = model
        self.session = session

    async def create(self, **kwargs: Any) -> ModelType:
        """
        Create and persist a new model instance.
        """
        instance = self.model(**kwargs)
        self.session.add(instance)
        await self.session.commit()
        await self.session.refresh(instance)
        return instance

    async def get_by_id(self, id: Any, include_deleted: bool = False) -> Optional[ModelType]:
        """
        Retrieve a single model instance by primary key ID.
        """
        query = select(self.model).where(self.model.id == id)
        if hasattr(self.model, "is_deleted") and not include_deleted:
            query = query.where(self.model.is_deleted == False)  # noqa: E712

        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_all(
        self, skip: int = 0, limit: int = 100, include_deleted: bool = False
    ) -> List[ModelType]:
        """
        Retrieve all model records with limit and offset.
        """
        query = select(self.model)
        if hasattr(self.model, "is_deleted") and not include_deleted:
            query = query.where(self.model.is_deleted == False)  # noqa: E712

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def update(self, id: Any, **kwargs: Any) -> Optional[ModelType]:
        """
        Update an existing model instance attributes by ID.
        """
        instance = await self.get_by_id(id, include_deleted=True)
        if not instance:
            return None

        for key, value in kwargs.items():
            if hasattr(instance, key):
                setattr(instance, key, value)

        self.session.add(instance)
        await self.session.commit()
        await self.session.refresh(instance)
        return instance

    async def delete(self, id: Any, soft: bool = True) -> bool:
        """
        Delete a model instance. Performs soft delete if supported and requested.
        """
        instance = await self.get_by_id(id, include_deleted=True)
        if not instance:
            return False

        if soft and hasattr(instance, "soft_delete"):
            instance.soft_delete()
            self.session.add(instance)
        else:
            await self.session.delete(instance)

        await self.session.commit()
        return True

    async def hard_delete(self, id: Any) -> bool:
        """
        Permanently delete a model instance from the database.
        """
        return await self.delete(id, soft=False)

    async def exists(self, id: Any) -> bool:
        """
        Check if a record exists by primary key ID.
        """
        query = select(func.count(self.model.id)).where(self.model.id == id)
        if hasattr(self.model, "is_deleted"):
            query = query.where(self.model.is_deleted == False)  # noqa: E712

        result = await self.session.execute(query)
        return (result.scalar() or 0) > 0

    async def count(self, include_deleted: bool = False) -> int:
        """
        Count total matching records in table.
        """
        query = select(func.count()).select_from(self.model)
        if hasattr(self.model, "is_deleted") and not include_deleted:
            query = query.where(self.model.is_deleted == False)  # noqa: E712

        result = await self.session.execute(query)
        return result.scalar() or 0

    async def paginate(
        self, page: int = 1, page_size: int = 20, include_deleted: bool = False
    ) -> Dict[str, Any]:
        """
        Paginate model records returning items along with pagination metadata.
        """
        page = max(1, page)
        page_size = max(1, page_size)
        skip = (page - 1) * page_size

        total_items = await self.count(include_deleted=include_deleted)
        items = await self.get_all(skip=skip, limit=page_size, include_deleted=include_deleted)
        total_pages = math.ceil(total_items / page_size) if total_items > 0 else 1

        return {
            "items": items,
            "total_items": total_items,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }
