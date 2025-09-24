from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional, TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from .base import Base

if TYPE_CHECKING:  # pragma: no cover
    from . import User

_ALLOWED_ACTIONS = {"reply", "pin_product"}


class Rule(Base):
    __tablename__ = "rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        default=1,
    )
    trigger: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(32), nullable=False)
    params_json: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="rules")

    @validates("trigger")
    def _normalize_trigger(self, _key: str, value: Optional[str]) -> str:
        if not value:
            raise ValueError("Rule trigger must not be empty")
        return value.strip().lower()

    @validates("action")
    def _validate_action(self, _key: str, value: Optional[str]) -> str:
        if not value:
            raise ValueError("Rule action must not be empty")
        normalized = value.strip().lower()
        if normalized not in _ALLOWED_ACTIONS:
            raise ValueError(f"Unsupported rule action: {value}")
        return normalized

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return (
            f"Rule(id={self.id!r}, trigger={self.trigger!r}, action={self.action!r}, "
            f"active={self.active!r})"
        )
