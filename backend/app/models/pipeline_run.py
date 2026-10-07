from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("datasets.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    dataset_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    destination_table: Mapped[str] = mapped_column(String(63), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    valid_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rejected_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rows_loaded: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    load_status: Mapped[str] = mapped_column(String(16), nullable=False, default="PENDING")
    load_error: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    duplicates: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    missing_values: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    quality_score: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    errors: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    @property
    def pipeline_name(self) -> str:
        return f"{self.dataset_filename} → {self.destination_table}"

    @property
    def duration(self) -> str:
        return f"{self.duration_ms / 1000:.2f}s"
