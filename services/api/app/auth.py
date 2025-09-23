from datetime import datetime, timedelta
from typing import Any, Dict

import jwt

from .config import settings


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT token for the provided subject"""
    expire = datetime.utcnow() + (expires_delta or timedelta(seconds=settings.jwt_expiry_seconds))
    payload: Dict[str, Any] = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token"""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])