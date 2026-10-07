from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, JSON, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class MLModel(Base):
    __tablename__ = "ml_models"
    __table_args__ = (UniqueConstraint("model_key", name="uq_ml_models_model_key"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    model_key: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    version: Mapped[str] = mapped_column(String(32), nullable=False)
    algorithm: Mapped[str] = mapped_column(String(160), nullable=False)
    dataset: Mapped[str] = mapped_column(String(160), nullable=False)
    trained_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    metrics: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(String(32), nullable=False)