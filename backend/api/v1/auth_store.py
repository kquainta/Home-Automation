"""In-memory user store. Replace with DB (e.g. SQLite) later.

This module now supports basic user management with an `is_admin` flag so that
administrators can manage all user accounts.
"""

from typing import Any, Dict, List, Optional

from api.v1.auth_utils import hash_password


# email (lowercased) -> {"hashed_password": str, "is_admin": bool, "must_change_password": bool}
_store: Dict[str, Dict[str, Any]] = {}


def _normalize_email(email: str) -> str:
    return email.lower()


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Return the stored user record for the given email, or None."""
    return _store.get(_normalize_email(email))


def create_user(email: str, password: str, is_admin: bool = False, must_change_password: bool = True) -> None:
    """Create or overwrite a user record. New users must change password on first login by default."""
    _store[_normalize_email(email)] = {
        "hashed_password": hash_password(password),
        "is_admin": bool(is_admin),
        "must_change_password": must_change_password,
    }


def update_user(
    email: str,
    *,
    password: Optional[str] = None,
    is_admin: Optional[bool] = None,
    must_change_password: Optional[bool] = None,
) -> bool:
    """Update an existing user. Returns True if the user existed and was updated."""
    key = _normalize_email(email)
    user = _store.get(key)
    if not user:
        return False

    if password is not None:
        user["hashed_password"] = hash_password(password)
    if is_admin is not None:
        user["is_admin"] = bool(is_admin)
    if must_change_password is not None:
        user["must_change_password"] = bool(must_change_password)
    return True


def delete_user(email: str) -> bool:
    """Delete a user by email. Returns True if a user was removed."""
    key = _normalize_email(email)
    if key in _store:
        del _store[key]
        return True
    return False


def list_users() -> List[Dict[str, Any]]:
    """Return a list of users without exposing password hashes."""
    return [
        {
            "email": email,
            "is_admin": bool(data.get("is_admin", False)),
            "must_change_password": bool(data.get("must_change_password", False)),
        }
        for email, data in _store.items()
    ]


def has_any_users() -> bool:
    """Return True if any user accounts exist."""
    return bool(_store)


def has_any_admin() -> bool:
    """Return True if any user has is_admin=True."""
    return any(data.get("is_admin") for data in _store.values())


def clear_all_users() -> None:
    """Remove all users. For development/testing only."""
    _store.clear()
