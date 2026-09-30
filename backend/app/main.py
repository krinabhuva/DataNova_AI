import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router

app = FastAPI(title="DataNova API")

allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins.split(",")],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")