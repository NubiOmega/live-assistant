from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str


class UserRegisterRequest(BaseModel):
    username: str
    password: str


class UserLoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


from .product import ProductIn, ProductOut  # noqa: E402,F401

__all__ = [
    "HealthResponse",
    "UserRegisterRequest",
    "UserLoginRequest",
    "TokenResponse",
    "ProductIn",
    "ProductOut",
]
