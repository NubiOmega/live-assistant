from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import db
from app.models.event import Event
from app.models.product import Product
from app.models.rule import Rule
from app.schemas.event import EventIngestRequest
from app.services.rule_engine import apply_rules

router = APIRouter(prefix="/events")

_DEFAULT_STREAM_ID = 1
_DEFAULT_USER_ID = 1
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


async def _fetch_active_rules(session: AsyncSession) -> List[Rule]:
    stmt = select(Rule).where(
        Rule.user_id == _DEFAULT_USER_ID,
        Rule.active.is_(True),
    )
    result = await session.scalars(stmt)
    return list(result.all())


async def _build_product_payload(
    product_id: int,
    session: AsyncSession,
) -> Optional[Dict[str, Any]]:
    stmt = select(Product).where(
        Product.id == product_id,
        Product.user_id == _DEFAULT_USER_ID,
    )
    product = await session.scalar(stmt)
    if product is None:
        return None

    return {
        "id": product.id,
        "title": product.title,
        "price": product.price,
        "url": product.url,
        "image": product.image,
        "tags": product.tags,
        "stock_info": product.stock_info,
    }


async def _dispatch_rule_actions(
    actions: List[Dict[str, Any]],
    session: AsyncSession,
) -> None:
    for action in actions:
        action_type = action.get("action")
        if action_type == "reply":
            text = action.get("text")
            if not text:
                _logger.debug("reply action skipped due to missing text")
                continue
            await _forward_to_gateway("auto_reply", {"text": text})
        elif action_type == "pin_product":
            product_id = action.get("product_id")
            if not isinstance(product_id, int):
                _logger.debug("pin_product action skipped due to invalid product_id")
                continue
            product_payload = await _build_product_payload(product_id, session)
            if product_payload is None:
                _logger.warning(
                    "pin_product action skipped; product %s not found", product_id
                )
                continue
            await _forward_to_gateway("pin_product", {"product": product_payload})
        else:
            _logger.debug("Unsupported rule action encountered: %s", action_type)


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

    if request.type == "chat":
        text = payload.get("text") or payload.get("message")
        if isinstance(text, str) and text.strip():
            rules = await _fetch_active_rules(session)
            actions = apply_rules(text, rules)
            if actions:
                await _dispatch_rule_actions(actions, session)

    return None
