from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from .models.base import Base, get_engine, get_sessionmaker

async_session_maker = get_sessionmaker()


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides an async database session."""

    async with async_session_maker() as session:
        yield session


async def init_db() -> None:
    """Initialise database structures if they do not yet exist."""

    from . import models  # noqa: F401  Ensures model metadata is registered

    async with get_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
