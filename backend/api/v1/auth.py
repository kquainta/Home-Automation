from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from api.v1.auth_schemas import (
    AdminUserCreate,
    AdminUserUpdate,
    ChangePassword,
    RegistrationAllowed,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
)
from api.v1.auth_store import (
    clear_all_users,
    create_user,
    delete_user,
    get_user_by_email,
    has_any_admin,
    has_any_users,
    list_users,
    update_user,
)
from api.v1.auth_utils import create_access_token, decode_token, verify_password
from core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


def get_current_user_email(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> str:
    if not credentials or credentials.scheme != "Bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email = decode_token(credentials.credentials)
    user = get_user_by_email(email) if email else None
    if not email or not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return email


def get_current_admin_email(email: str = Depends(get_current_user_email)) -> str:
    user = get_user_by_email(email)
    if not user or not user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return email


@router.get("/registration-allowed", response_model=RegistrationAllowed)
async def registration_allowed():
    """Return whether the first-admin registration flow is available (no admin user exists yet)."""
    return RegistrationAllowed(allowed=not has_any_admin())


def _do_clear_users():
    """Clear all users. Used by both GET and POST."""
    clear_all_users()


@router.get("/dev/clear-users", status_code=status.HTTP_200_OK)
async def dev_clear_users_get():
    """Clear all users via GET (so you can use a link; works with proxy). Returns a simple HTML page."""
    _do_clear_users()
    html = """
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><title>Reset done</title></head>
    <body style="font-family:sans-serif;max-width:400px;margin:2rem auto;padding:1rem;background:#0f172a;color:#e2e8f0;">
    <h1 style="color:#f59e0b;">Users cleared</h1>
    <p>All users have been removed. Close this tab, go back to the app, and refresh the Register page to create the first administrator.</p>
    <p><a href="/register" style="color:#38bdf8;">Back to Register</a></p>
    </body></html>
    """
    return Response(content=html.strip(), media_type="text/html")


@router.post("/dev/clear-users", status_code=status.HTTP_204_NO_CONTENT)
async def dev_clear_users_post():
    """Clear all users. In production, protect or remove this route."""
    _do_clear_users()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _seed_dev_users() -> None:
    """Create or overwrite seeded users from env (E2E_SEED_*, ADMIN_SEED_*, USER1_SEED_*, USER2_SEED_*, USER3_SEED_*). Only seeds when both email and password are set."""
    if settings.E2E_SEED_EMAIL.strip() and settings.E2E_SEED_PASSWORD:
        create_user(
            settings.E2E_SEED_EMAIL.strip(),
            settings.E2E_SEED_PASSWORD,
            is_admin=True,
            must_change_password=False,
        )
    if settings.ADMIN_SEED_EMAIL.strip() and settings.ADMIN_SEED_PASSWORD:
        create_user(
            settings.ADMIN_SEED_EMAIL.strip(),
            settings.ADMIN_SEED_PASSWORD,
            is_admin=True,
            must_change_password=False,
        )
    if settings.USER1_SEED_EMAIL.strip() and settings.USER1_SEED_PASSWORD:
        create_user(
            settings.USER1_SEED_EMAIL.strip(),
            settings.USER1_SEED_PASSWORD,
            is_admin=False,
            must_change_password=False,
        )
    if settings.USER2_SEED_EMAIL.strip() and settings.USER2_SEED_PASSWORD:
        create_user(
            settings.USER2_SEED_EMAIL.strip(),
            settings.USER2_SEED_PASSWORD,
            is_admin=False,
            must_change_password=False,
        )
    if settings.USER3_SEED_EMAIL.strip() and settings.USER3_SEED_PASSWORD:
        create_user(
            settings.USER3_SEED_EMAIL.strip(),
            settings.USER3_SEED_PASSWORD,
            is_admin=False,
            must_change_password=False,
        )


@router.post("/dev/seed-e2e-user", status_code=status.HTTP_204_NO_CONTENT)
async def dev_seed_e2e_user_post():
    """Ensure the known E2E and admin users exist. Call before login tests or use for manual admin access."""
    _seed_dev_users()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/dev/seed-e2e-user", status_code=status.HTTP_200_OK)
async def dev_seed_e2e_user_get():
    """Same as POST: create seed users. Open in browser to force seed, then try logging in as admin."""
    _seed_dev_users()
    return Response(
        content="<html><body><h1>Seed done</h1><p>E2E and admin users created. Try logging in as admin.</p></body></html>",
        media_type="text/html",
    )


@router.get("/dev/seed-status")
async def dev_seed_status():
    """Debug: see if seed env is loaded and if admin user exists. Open in browser to verify setup."""
    admin_email = (getattr(settings, "ADMIN_SEED_EMAIL", "") or "").strip()
    admin_configured = bool(admin_email and getattr(settings, "ADMIN_SEED_PASSWORD", ""))
    admin_exists = get_user_by_email(admin_email or "admin") is not None
    return {
        "admin_configured": admin_configured,
        "admin_exists": admin_exists,
        "admin_email_set": bool(admin_email),
    }


@router.post("/register", response_model=Token)
async def register(data: UserCreate):
    """Self-service registration is only allowed when no admin user exists.

    The new user becomes an administrator. If an admin already exists, all
    additional users must be created by an admin via the admin user endpoints.
    """
    if has_any_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Self-service registration is disabled. Contact an administrator.",
        )

    if get_user_by_email(data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # New user is created as admin (no admin existed).
    create_user(data.email, data.password, is_admin=True, must_change_password=True)
    access_token = create_access_token(data.email)
    return Token(
        access_token=access_token,
        user=UserResponse(email=data.email, is_admin=True, must_change_password=True),
    )


@router.post("/login", response_model=Token)
async def login(data: UserLogin):
    user = get_user_by_email(data.email)
    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    access_token = create_access_token(data.email)
    must_change = bool(user.get("must_change_password", False))
    return Token(
        access_token=access_token,
        user=UserResponse(
            email=data.email,
            is_admin=bool(user.get("is_admin")),
            must_change_password=must_change,
        ),
    )


@router.get("/me", response_model=UserResponse)
async def me(email: str = Depends(get_current_user_email)):
    user = get_user_by_email(email)
    if not user:
        return UserResponse(email=email, is_admin=False, must_change_password=False)
    return UserResponse(
        email=email,
        is_admin=bool(user.get("is_admin")),
        must_change_password=bool(user.get("must_change_password", False)),
    )


@router.post("/change-password", response_model=UserResponse)
async def change_password(
    data: ChangePassword,
    email: str = Depends(get_current_user_email),
):
    """Change the current user's password. Required on first login."""
    user = get_user_by_email(email)
    if not user or not verify_password(data.current_password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )
    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters",
        )
    update_user(email, password=data.new_password, must_change_password=False)
    return UserResponse(
        email=email,
        is_admin=bool(user.get("is_admin")),
        must_change_password=False,
    )


@router.get("/users", response_model=list[UserResponse])
async def list_all_users(_: str = Depends(get_current_admin_email)):
    """List all users (admin-only)."""
    return [
        UserResponse(
            email=user["email"],
            is_admin=bool(user.get("is_admin")),
            must_change_password=bool(user.get("must_change_password", False)),
        )
        for user in list_users()
    ]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_admin(data: AdminUserCreate, _: str = Depends(get_current_admin_email)):
    """Create a new user account (admin-only)."""
    if get_user_by_email(data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    create_user(data.email, data.password, is_admin=data.is_admin, must_change_password=True)
    return UserResponse(email=data.email, is_admin=data.is_admin, must_change_password=True)


@router.patch("/users/{email}", response_model=UserResponse)
async def update_user_admin(
    email: str,
    data: AdminUserUpdate,
    _: str = Depends(get_current_admin_email),
):
    """Update an existing user (admin-only)."""
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_kwargs = {}
    if data.password is not None:
        update_kwargs["password"] = data.password
        update_kwargs["must_change_password"] = True  # Require password change on next login
    if data.is_admin is not None:
        update_kwargs["is_admin"] = data.is_admin
    updated = update_user(email, **update_kwargs)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    updated_user = get_user_by_email(email)
    return UserResponse(
        email=email,
        is_admin=bool(updated_user.get("is_admin")) if updated_user else False,
        must_change_password=bool(updated_user.get("must_change_password", False)) if updated_user else False,
    )


@router.delete("/users/{email}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_admin(email: str, _: str = Depends(get_current_admin_email)):
    """Delete a user account (admin-only)."""
    if not delete_user(email):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
