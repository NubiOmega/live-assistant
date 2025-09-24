from __future__ import annotations

from typing import Any, Dict, Iterable, List

from app.models.rule import Rule

ActionPayload = Dict[str, Any]


def apply_rules(text: str, rules: Iterable[Rule]) -> List[ActionPayload]:
    """Evaluate incoming text against rules and return triggered actions."""

    if not text:
        return []

    normalized_text = text.lower()
    triggered_actions: List[ActionPayload] = []

    for rule in rules:
        if not rule.active:
            continue

        trigger = (rule.trigger or "").strip().lower()
        if not trigger:
            continue

        if trigger not in normalized_text:
            continue

        params = dict(rule.params_json or {})
        action_payload: ActionPayload = {"action": rule.action}
        action_payload.update(params)
        triggered_actions.append(action_payload)

    return triggered_actions
