from typing import Any, Dict

from pydantic import BaseModel, Field


class EventIngestRequest(BaseModel):
    type: str
    payload: Dict[str, Any] = Field(default_factory=dict)
