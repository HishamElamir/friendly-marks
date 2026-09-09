import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from ..models.document import DocumentCategory


class DocumentCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    authors: str | None = Field(default=None, max_length=300)
    category: DocumentCategory = DocumentCategory.OTHER
    filename: str = Field(min_length=1, max_length=300)
    content_type: str = "application/pdf"


class DocumentCreateResponse(BaseModel):
    document_id: uuid.UUID
    upload_url: str


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    authors: str | None
    category: str
    original_filename: str
    file_size_bytes: int | None
    page_count: int | None
    status: str
    created_at: datetime
    updated_at: datetime

    # populated by the router, not stored on the model
    marks_count: int = 0
    progress_percent: float = 0.0
    progress_page: int = 1


class DocumentFileUrlOut(BaseModel):
    url: str
