from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from app.database.engine import engine

# Global Async Session Factory
AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)
