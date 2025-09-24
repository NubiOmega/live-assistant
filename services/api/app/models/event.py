from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

if TYPE_CHECKING:
    from . import Stream


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    stream_id: Mapped[int] = mapped_column(
        ForeignKey("streams.id", ondelete="CASCADE"),
        nullable=False,
        default=1,
    )
    type: Mapped[str] = mapped_column(String(120), nullable=False)
    payload_json: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    ts: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    stream: Mapped["Stream"] = relationship(back_populates="events")
