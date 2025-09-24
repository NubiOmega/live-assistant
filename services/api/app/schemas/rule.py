from typing import Any, Dict, Literal

from pydantic import BaseModel, Field, ConfigDict, field_validator


class RuleIn(BaseModel):
    trigger: str = Field(min_length=1)
    action: Literal["reply", "pin_product"]
    params_json: Dict[str, Any] = Field(default_factory=dict)
    active: bool = True

    @field_validator("trigger")
    @classmethod
    def _normalize_trigger(cls, value: str) -> str:
        return value.strip().lower()


class RuleOut(RuleIn):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class RuleEvalRequest(BaseModel):
    text: str = Field(min_length=1)
