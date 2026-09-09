from datetime import datetime, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session as DBSession

from ..config import get_settings
from ..db import get_db
from ..deps import get_current_user
from ..models import Session as SessionModel
from ..models import User
from ..schemas.auth import LoginRequest, SignupRequest, UserOut
from ..services.auth import (
    hash_password,
    hash_token,
    new_session_token,
    session_expiry,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # flip to True once served over HTTPS in production
        max_age=settings.session_ttl_days * 24 * 60 * 60,
        path="/",
    )


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, response: Response, db: DBSession = Depends(get_db)) -> User:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name,
    )
    db.add(user)
    db.flush()

    token = new_session_token()
    db.add(
        SessionModel(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=session_expiry(settings.session_ttl_days),
        )
    )
    db.commit()
    db.refresh(user)

    _set_session_cookie(response, token)
    return user


@router.post("/login", response_model=UserOut)
def login(payload: LoginRequest, response: Response, db: DBSession = Depends(get_db)) -> User:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    token = new_session_token()
    db.add(
        SessionModel(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=session_expiry(settings.session_ttl_days),
        )
    )
    db.commit()

    _set_session_cookie(response, token)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    db: DBSession = Depends(get_db),
    _user: User = Depends(get_current_user),
    session_token: str | None = Cookie(default=None, alias=settings.session_cookie_name),
) -> None:
    if session_token:
        session = db.query(SessionModel).filter(SessionModel.token_hash == hash_token(session_token)).first()
        if session is not None:
            session.revoked_at = datetime.now(timezone.utc)
            db.commit()
    response.delete_cookie(key=settings.session_cookie_name, path="/")


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user
