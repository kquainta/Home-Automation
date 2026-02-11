from fastapi import APIRouter
from api.v1.auth import router as auth_router
from api.v1.homeassistant import router as homeassistant_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(homeassistant_router)

@api_router.get("/status")
async def get_status():
    return {"status": "ok", "version": "1.0.0"}
