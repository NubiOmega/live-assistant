from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


class Base(DeclarativeBase):
    """Base declarative class for the application's ORM models."""


_engine: Optional[AsyncEngine] = None
_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


def get_engine() -> AsyncEngine:
    """Create (or return an existing) async engine bound to the configured database URL."""

    global _engine
    if _engine is None:
        _engine = create_async_engine(settings.database_url, echo=False, future=True)
    return _engine


def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    """Return a singleton async session factory bound to the engine."""

    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            expire_on_commit=False,
            class_=AsyncSession,
        )
    return _session_factory


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async SQLAlchemy session."""

    async_session_factory = get_sessionmaker()
    async with async_session_factory() as session:
        yield session
