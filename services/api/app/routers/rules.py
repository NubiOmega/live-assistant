from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import db
from app.models.rule import Rule
from app.schemas.rule import RuleEvalRequest, RuleIn, RuleOut
from app.services.rule_engine import apply_rules

router = APIRouter(prefix="/rules", tags=["rules"])

_DEFAULT_USER_ID = 1


async def _get_rule_or_404(rule_id: int, session: AsyncSession) -> Rule:
    stmt = select(Rule).where(
        Rule.id == rule_id,
        Rule.user_id == _DEFAULT_USER_ID,
    )
    rule = await session.scalar(stmt)
    if rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    return rule


@router.get("/", response_model=List[RuleOut])
async def list_rules(session: AsyncSession = Depends(db.get_async_session)) -> List[RuleOut]:
    stmt = (
        select(Rule)
        .where(Rule.user_id == _DEFAULT_USER_ID)
        .order_by(Rule.created_at.desc())
    )
    result = await session.scalars(stmt)
    return list(result.all())


@router.post("/", response_model=RuleOut, status_code=status.HTTP_201_CREATED)
async def create_rule(
    payload: RuleIn,
    session: AsyncSession = Depends(db.get_async_session),
) -> RuleOut:
    rule = Rule(
        user_id=_DEFAULT_USER_ID,
        trigger=payload.trigger,
        action=payload.action,
        params_json=payload.params_json,
        active=payload.active,
    )
    session.add(rule)
    await session.commit()
    await session.refresh(rule)
    return rule


@router.put("/{rule_id}", response_model=RuleOut)
async def update_rule(
    rule_id: int,
    payload: RuleIn,
    session: AsyncSession = Depends(db.get_async_session),
) -> RuleOut:
    rule = await _get_rule_or_404(rule_id, session)

    rule.trigger = payload.trigger
    rule.action = payload.action
    rule.params_json = payload.params_json
    rule.active = payload.active

    await session.commit()
    await session.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: int,
    session: AsyncSession = Depends(db.get_async_session),
) -> None:
    rule = await _get_rule_or_404(rule_id, session)
    await session.delete(rule)
    await session.commit()
    return None


@router.post("/eval", response_model=List[Dict[str, Any]])
async def evaluate_rules(
    payload: RuleEvalRequest,
    session: AsyncSession = Depends(db.get_async_session),
) -> List[Dict[str, Any]]:
    stmt = select(Rule).where(
        Rule.user_id == _DEFAULT_USER_ID,
        Rule.active.is_(True),
    )
    result = await session.scalars(stmt)
    actions = apply_rules(payload.text, list(result.all()))
    return actions
