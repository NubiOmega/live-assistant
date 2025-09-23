from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (AsyncSession, async_sessionmaker,
                                     create_async_engine)
from sqlalchemy.orm import DeclarativeBase

from .config import settings


class Base(DeclarativeBase):
    """Base model for SQLAlchemy ORM"""


engine = create_async_engine(settings.database_url, echo=False, future=True)
async_session_maker = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides an async database session"""
    async with async_session_maker() as session:
        yield session


async def init_db() -> None:
    """Placeholder for database initialisation (e.g. running migrations)"""
    # Late import to register ORM models with metadata before `create_all`
    from . import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)