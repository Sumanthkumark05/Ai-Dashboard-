import uuid
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from sqlalchemy import String, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, SoftDeleteMixin, TimestampMixin, UUIDMixin
from app.database.health import check_database
from app.database.transaction import DatabaseTransaction
from app.repositories.base_repository import BaseRepository

# Test-only dummy ORM model
class DummyModel(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "test_dummy_models"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(255), default="")


class DummyRepository(BaseRepository[DummyModel]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(DummyModel, session)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Async SQLite in-memory database fixture for database infrastructure testing.
    """
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        bind=test_engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
    )

    async with session_factory() as session:
        yield session

    await test_engine.dispose()


@pytest.mark.asyncio
async def test_database_health_check() -> None:
    """
    Test database health diagnostic check function.
    """
    result = await check_database()
    assert "status" in result
    assert "healthy" in result
    assert "latency_ms" in result


@pytest.mark.asyncio
async def test_base_orm_mixins(db_session: AsyncSession) -> None:
    """
    Test UUIDMixin, TimestampMixin, and SoftDeleteMixin attributes and methods.
    """
    item = DummyModel(name="Test Item", description="Infrastructure Test")
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)

    # Assert UUIDMixin
    assert isinstance(item.id, uuid.UUID)

    # Assert TimestampMixin
    assert item.created_at is not None
    assert item.updated_at is not None

    # Assert SoftDeleteMixin
    assert item.is_deleted is False
    assert item.deleted_at is None

    item.soft_delete()
    assert item.is_deleted is True
    assert item.deleted_at is not None

    item.restore()
    assert item.is_deleted is False
    assert item.deleted_at is None


@pytest.mark.asyncio
async def test_base_repository_crud(db_session: AsyncSession) -> None:
    """
    Test generic CRUD methods in BaseRepository.
    """
    repo = DummyRepository(db_session)

    # 1. Create
    created = await repo.create(name="Alpha", description="First Entity")
    assert created.id is not None
    assert created.name == "Alpha"

    # 2. Get By ID
    retrieved = await repo.get_by_id(created.id)
    assert retrieved is not None
    assert retrieved.name == "Alpha"

    # 3. Exists & Count
    assert await repo.exists(created.id) is True
    assert await repo.count() == 1

    # 4. Update
    updated = await repo.update(created.id, name="Alpha Updated")
    assert updated is not None
    assert updated.name == "Alpha Updated"

    # 5. Soft Delete
    deleted = await repo.delete(created.id, soft=True)
    assert deleted is True
    assert await repo.get_by_id(created.id) is None
    assert await repo.count() == 0
    assert await repo.count(include_deleted=True) == 1

    # 6. Hard Delete
    hard_deleted = await repo.hard_delete(created.id)
    assert hard_deleted is True
    assert await repo.count(include_deleted=True) == 0


@pytest.mark.asyncio
async def test_repository_pagination(db_session: AsyncSession) -> None:
    """
    Test repository pagination helper.
    """
    repo = DummyRepository(db_session)

    for i in range(15):
        await repo.create(name=f"Item {i}")

    result = await repo.paginate(page=1, page_size=5)
    assert len(result["items"]) == 5
    assert result["total_items"] == 15
    assert result["total_pages"] == 3
    assert result["has_next"] is True
    assert result["has_prev"] is False


@pytest.mark.asyncio
async def test_transaction_manager_rollback(db_session: AsyncSession) -> None:
    """
    Test DatabaseTransaction context manager rollback on exception.
    """
    repo = DummyRepository(db_session)

    with pytest.raises(RuntimeError):
        async with DatabaseTransaction(db_session):
            db_session.add(DummyModel(name="Transient Item"))
            raise RuntimeError("Simulated transaction failure")

    result = await repo.get_all()
    assert len(result) == 0
