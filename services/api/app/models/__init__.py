from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    products: Mapped[List["Product"]] = relationship(
        "Product", back_populates="user", cascade="all, delete-orphan"
    )
    streams: Mapped[List["Stream"]] = relationship(
        "Stream", back_populates="user", cascade="all, delete-orphan"
    )
    rules: Mapped[List["Rule"]] = relationship(
        "Rule", back_populates="user", cascade="all, delete-orphan"
    )


class Stream(Base):
    __tablename__ = "streams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    platform: Mapped[str] = mapped_column(String(120), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    user: Mapped["User"] = relationship(back_populates="streams")
    events: Mapped[List["Event"]] = relationship(
        "Event", back_populates="stream", cascade="all, delete-orphan"
    )


from .product import Product  # noqa: E402,F401
from .event import Event  # noqa: E402,F401
from .rule import Rule  # noqa: E402,F401

__all__ = ["Base", "Product", "User", "Stream", "Event", "Rule"]
