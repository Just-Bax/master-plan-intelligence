import uuid
from datetime import datetime

from pydantic import BaseModel


class FileResponse(BaseModel):
    file_id: uuid.UUID
    filename: str
    size: int
    created_at: datetime

    model_config = {"from_attributes": True}
