from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.v1.api import api_router
from api.v1.auth import _seed_dev_users
from core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
async def startup():
    """Seed E2E and admin users when credentials are in env (E2E_SEED_USER=true or any seed email+password set)."""
    import logging
    seed_on_startup = getattr(settings, "E2E_SEED_USER", False)
    has_e2e = (getattr(settings, "E2E_SEED_EMAIL", "") or "").strip() and getattr(settings, "E2E_SEED_PASSWORD", "")
    has_admin = (getattr(settings, "ADMIN_SEED_EMAIL", "") or "").strip() and getattr(settings, "ADMIN_SEED_PASSWORD", "")
    if seed_on_startup or has_e2e or has_admin:
        _seed_dev_users()
        log = logging.getLogger("uvicorn.error")
        log.info("Seeded users: E2E=%s, Admin=%s", "yes" if has_e2e else "no", "yes" if has_admin else "no")


@app.get("/")
async def root():
    return {"message": "Welcome to the Home Automation API"}
