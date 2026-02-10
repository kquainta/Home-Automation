from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from api.v1.auth_schemas import UserCreate, UserLogin, Token, UserResponse
from api.v1.auth_utils import verify_password, create_access_token, decode_token
from api.v1.auth_store import get_user_by_email, create_user

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
    if not email or not get_user_by_email(email):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return email


@router.post("/register", response_model=Token)
async def register(data: UserCreate):
    if get_user_by_email(data.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    create_user(data.email, data.password)
    access_token = create_access_token(data.email)
    return Token(
        access_token=access_token,
        user=UserResponse(email=data.email),
    )


@router.post("/login", response_model=Token)
async def login(data: UserLogin):
    hashed = get_user_by_email(data.email)
    if not hashed or not verify_password(data.password, hashed):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    access_token = create_access_token(data.email)
    return Token(
        access_token=access_token,
        user=UserResponse(email=data.email),
    )


@router.get("/me", response_model=UserResponse)
async def me(email: str = Depends(get_current_user_email)):
    return UserResponse(email=email)
