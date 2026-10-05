from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DatasetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    file_type: str
    content_type: str
    file_size_bytes: int
    row_count: int
    column_count: int
    uploaded_at: datetime
