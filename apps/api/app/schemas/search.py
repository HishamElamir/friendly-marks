import uuid

from pydantic import BaseModel


class PageMatch(BaseModel):
    document_id: uuid.UUID
    document_title: str
    page_number: int
    snippet: str


class MarkMatch(BaseModel):
    annotation_id: uuid.UUID
    document_id: uuid.UUID
    document_title: str
    type: str
    page_number: int
    snippet: str


class SearchResponse(BaseModel):
    pages: list[PageMatch]
    marks: list[MarkMatch]
