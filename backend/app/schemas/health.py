from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"] = Field(default="ok")
    service: str = "DataNova API"
    database: str = "unknown"
    message: str = "Service is healthy"


class DatabaseHealthResponse(BaseModel):
    database: str = "postgresql"
    status: Literal["connected", "unavailable"]
    details: str