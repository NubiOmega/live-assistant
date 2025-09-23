from http import HTTPStatus

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from . import auth, db
from .config import settings
from .routers import products
from .schemas import (
    HealthResponse,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
)

app = FastAPI(title=settings.app_name)

app.include_router(products.router, prefix="/products", tags=["products"])


@app.on_event("startup")
async def on_startup() -> None:
    # Ensure database structures exist before the application starts accepting traffic
    await db.init_db()


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post(
    "/users/register",
    response_model=TokenResponse,
    status_code=HTTPStatus.CREATED,
)
async def register_user(
    payload: UserRegisterRequest,
    session: AsyncSession = Depends(db.get_async_session),
) -> TokenResponse:
    # Placeholder logic: wire up actual persistence/validation here
    _ = session  # suppress unused warning until user handling is implemented
    token = auth.create_access_token(payload.username)
    return TokenResponse(access_token=token)


@app.post("/users/login", response_model=TokenResponse)
async def login_user(
    payload: UserLoginRequest,
    session: AsyncSession = Depends(db.get_async_session),
) -> TokenResponse:
    # Placeholder logic: validate credentials against persisted users here
    _ = session
    if not payload.username:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail="Username required")

    token = auth.create_access_token(payload.username)
    return TokenResponse(access_token=token)
