from fastapi import APIRouter
from .investment import router as investment_router
from .main_system import router as main_system_router

api_router = APIRouter()
api_router.include_router(investment_router)
api_router.include_router(main_system_router)
