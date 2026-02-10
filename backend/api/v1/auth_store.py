"""In-memory user store. Replace with DB (e.g. SQLite) later."""

from api.v1.auth_utils import hash_password

_store: dict[str, str] = {}  # email -> hashed_password


def get_user_by_email(email: str) -> str | None:
    return _store.get(email.lower())


def create_user(email: str, password: str) -> None:
    _store[email.lower()] = hash_password(password)
