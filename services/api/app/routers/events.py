from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import httpx
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import db
from app.models.event import Event
from app.schemas.event import EventIngestRequest

router = APIRouter(prefix="/events")

_DEFAULT_STREAM_ID = 1
_GATEWAY_ENDPOINTS = (
    "http://gateway:3000/broadcast",
    "http://localhost:3000/broadcast",
)
_CHANNEL_BY_TYPE = {
    "chat": "chat.events",
    "gift": "gift.events",
}

_logger = logging.getLogger(__name__)


async def _forward_to_gateway(event_type: str, payload: Dict[str, Any]) -> None:
    """Forward the event payload to the gateway, trying known endpoints."""

    channel = _CHANNEL_BY_TYPE.get(event_type, "chat.events")
    message = {"type": event_type, **payload}

    async with httpx.AsyncClient(timeout=5.0) as client:
        last_error: Optional[Exception] = None
        for endpoint in _GATEWAY_ENDPOINTS:
            try:
                response = await client.post(
                    endpoint,
                    json={"channel": channel, "message": message},
                )
                response.raise_for_status()
                return
            except httpx.HTTPError as exc:
                last_error = exc
                _logger.warning(
                    "Failed to broadcast event via %s: %s", endpoint, exc, exc_info=False
                )

        if last_error is not None:
            _logger.error(
                "Unable to broadcast event after trying all endpoints: %s", last_error
            )


@router.post("/ingest", status_code=status.HTTP_204_NO_CONTENT)
async def ingest_event(
    request: EventIngestRequest,
    session: AsyncSession = Depends(db.get_async_session),
) -> None:
    payload = dict(request.payload)
    event = Event(
        stream_id=_DEFAULT_STREAM_ID,
        type=request.type,
        payload_json=payload,
    )
    session.add(event)
    await session.commit()

    await _forward_to_gateway(request.type, payload)
    return None
