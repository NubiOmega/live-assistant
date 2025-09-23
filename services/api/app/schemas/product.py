from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl
from pydantic import ConfigDict


class ProductIn(BaseModel):
    title: str
    price: int = Field(ge=0)
    url: HttpUrl
    image: Optional[HttpUrl] = None
    tags: List[str] = Field(default_factory=list)
    stock_info: Optional[str] = None


class ProductOut(ProductIn):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
