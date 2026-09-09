import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def new_session_token() -> str:
    """Returns the raw token to hand to the client (in the cookie)."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """One-way hash stored in the DB so a leaked DB row can't be replayed as a cookie."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def session_expiry(ttl_days: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=ttl_days)
