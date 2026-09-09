import uuid

from pydantic import BaseModel, Field


class ProgressUpdateRequest(BaseModel):
    page_number: int = Field(ge=1)
    percent: float = Field(ge=0, le=100)
    device_id: uuid.UUID | None = None


class ProgressOut(BaseModel):
    document_id: uuid.UUID
    page_number: int
    percent: float
