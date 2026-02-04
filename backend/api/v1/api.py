from fastapi import APIRouter

api_router = APIRouter()

@api_router.get("/status")
async def get_status():
    return {"status": "ok", "version": "1.0.0"}
