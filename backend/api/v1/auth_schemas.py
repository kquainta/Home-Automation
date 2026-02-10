from pydantic import BaseModel


class UserCreate(BaseModel):
    # Relaxed to plain string; no strict email validation required.
    email: str
    password: str


class UserLogin(BaseModel):
    # Relaxed to plain string; no strict email validation required.
    email: str
    password: str


class UserResponse(BaseModel):
    email: str
    is_admin: bool = False
    must_change_password: bool = False


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AdminUserCreate(BaseModel):
    email: str
    password: str
    is_admin: bool = False


class AdminUserUpdate(BaseModel):
    password: str | None = None
    is_admin: bool | None = None


class RegistrationAllowed(BaseModel):
    """Whether self-service registration is allowed (only when no users exist)."""
    allowed: bool
