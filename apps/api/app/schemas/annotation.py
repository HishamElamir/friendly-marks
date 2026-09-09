import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

from ..models.annotation import AnnotationType


class AnnotationCreateRequest(BaseModel):
    type: AnnotationType
    page_number: int = Field(ge=0)
    color: str | None = None
    quote_text: str | None = None
    body_text: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)
    device_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def _validate_shape(self) -> "AnnotationCreateRequest":
        if self.type == AnnotationType.HIGHLIGHT:
            rects = self.data.get("rects")
            if not isinstance(rects, list) or not rects:
                raise ValueError("highlight annotations require data.rects (non-empty list)")
        elif self.type == AnnotationType.NOTE:
            if "xPct" not in self.data or "yPct" not in self.data:
                raise ValueError("note annotations require data.xPct and data.yPct")
        elif self.type == AnnotationType.STROKE:
            for key in ("xPct", "yPct", "w", "path"):
                if key not in self.data:
                    raise ValueError(f"stroke annotations require data.{key}")
        return self


class AnnotationUpdateRequest(BaseModel):
    body_text: str | None = None
    color: str | None = None


class AnnotationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_id: uuid.UUID
    type: str
    page_number: int
    color: str | None
    quote_text: str | None
    body_text: str | None
    data: dict[str, Any]
    created_at: datetime
    updated_at: datetime
