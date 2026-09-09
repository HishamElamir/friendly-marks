from datetime import datetime, timezone

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from .config import get_settings
from .db import get_db
from .models import Session as SessionModel
from .models import User
from .services.auth import hash_token

settings = get_settings()


def get_current_user(
    db: DBSession = Depends(get_db),
    session_token: str | None = Cookie(default=None, alias=settings.session_cookie_name),
) -> User:
    cookie_value = session_token
    if cookie_value is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    token_hash = hash_token(cookie_value)
    session = db.query(SessionModel).filter(SessionModel.token_hash == token_hash).first()
    if session is None or session.revoked_at is not None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session invalid")
    if session.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired")

    user = db.query(User).filter(User.id == session.user_id).first()
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session invalid")
    return user
