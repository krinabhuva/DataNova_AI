import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PipelineRunCreate(BaseModel):
    dataset_id: int = Field(gt=0)
    destination_table: str = Field(min_length=1, max_length=63)
    missing_value_action: Literal["keep", "drop_row", "fill"] = "keep"
    fill_value: str = ""
    duplicate_action: Literal["drop", "keep"] = "drop"
    numeric_columns: list[str] = Field(default_factory=list)
    date_columns: list[str] = Field(default_factory=list)
    drop_columns: list[str] = Field(default_factory=list)
    lowercase_columns: list[str] = Field(default_factory=list)
    uppercase_columns: list[str] = Field(default_factory=list)
    rename_columns: dict[str, str] = Field(default_factory=dict)
    trim_strings: bool = True
    normalize_headers: bool = True

    @field_validator("destination_table")
    @classmethod
    def validate_destination_table(cls, value: str) -> str:
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", value):
            raise ValueError("Destination table must be a valid SQL identifier.")
        return value

    @field_validator(
        "numeric_columns",
        "date_columns",
        "drop_columns",
        "lowercase_columns",
        "uppercase_columns",
    )
    @classmethod
    def remove_duplicate_column_names(cls, value: list[str]) -> list[str]:
        if len(value) != len(set(value)):
            raise ValueError("Column lists cannot contain duplicates.")
        return value


class PipelineRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dataset_id: int
    dataset_filename: str
    pipeline_name: str
    destination_table: str
    status: Literal["RUNNING", "SUCCESS", "FAILED"]
    total_rows: int
    valid_rows: int
    rejected_rows: int
    rows_loaded: int
    load_status: Literal["PENDING", "SUCCESS", "FAILED"]
    load_error: str | None
    duplicates: int
    missing_values: int
    quality_score: float
    duration_ms: int
    duration: str
    started_at: datetime
    finished_at: datetime | None
    created_at: datetime
    errors: list[str]
