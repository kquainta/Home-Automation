from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from api.v1.api import api_router
from api.v1.auth import _seed_dev_users
from core.config import settings
from core import db
from services import energy_history

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

# Global scheduler instance
scheduler = AsyncIOScheduler()


@app.on_event("startup")
async def startup():
    """Initialize database, seed users, and start scheduled jobs."""
    import logging
    log = logging.getLogger("uvicorn.error")
    
    # Initialize database
    try:
        db.init_db()
        log.info("Database initialized")
    except Exception as e:
        log.error(f"Failed to initialize database: {e}")
    
    # Seed E2E and admin users when credentials are in env
    seed_on_startup = getattr(settings, "E2E_SEED_USER", False)
    has_e2e = (getattr(settings, "E2E_SEED_EMAIL", "") or "").strip() and getattr(settings, "E2E_SEED_PASSWORD", "")
    has_admin = (getattr(settings, "ADMIN_SEED_EMAIL", "") or "").strip() and getattr(settings, "ADMIN_SEED_PASSWORD", "")
    has_user1 = (getattr(settings, "USER1_SEED_EMAIL", "") or "").strip() and getattr(settings, "USER1_SEED_PASSWORD", "")
    has_user2 = (getattr(settings, "USER2_SEED_EMAIL", "") or "").strip() and getattr(settings, "USER2_SEED_PASSWORD", "")
    has_user3 = (getattr(settings, "USER3_SEED_EMAIL", "") or "").strip() and getattr(settings, "USER3_SEED_PASSWORD", "")
    if seed_on_startup or has_e2e or has_admin or has_user1 or has_user2 or has_user3:
        _seed_dev_users()
        log.info("Seeded users: E2E=%s, Admin=%s, User1=%s, User2=%s, User3=%s", 
                 "yes" if has_e2e else "no", 
                 "yes" if has_admin else "no",
                 "yes" if has_user1 else "no",
                 "yes" if has_user2 else "no",
                 "yes" if has_user3 else "no")
    
    # Schedule daily energy snapshot at 11:59 PM
    scheduler.add_job(
        energy_history.record_today_snapshot,
        trigger=CronTrigger(hour=23, minute=59),
        id="daily_energy_snapshot",
        name="Record daily energy usage and cost snapshot",
        replace_existing=True,
    )
    scheduler.start()
    log.info("Scheduled daily energy snapshot job (23:59 daily)")


@app.on_event("shutdown")
async def shutdown():
    """Shutdown scheduler gracefully."""
    scheduler.shutdown()


@app.get("/")
async def root():
    return {"message": "Welcome to the Home Automation API"}
