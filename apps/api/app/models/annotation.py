import uuid
from enum import StrEnum

from sqlalchemy import Computed, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base
from .mixins import TimestampMixin, UUIDPKMixin


class AnnotationType(StrEnum):
    HIGHLIGHT = "highlight"
    NOTE = "note"
    STROKE = "stroke"


class Annotation(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "annotations"
    __table_args__ = (Index("ix_annotations_search_tsv", "search_tsv", postgresql_using="gin"),)

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    device_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("devices.id", ondelete="SET NULL"), nullable=True
    )
    type: Mapped[str] = mapped_column(String(16), index=True)
    page_number: Mapped[int] = mapped_column(Integer)
    color: Mapped[str | None] = mapped_column(String(16), nullable=True)
    quote_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    data: Mapped[dict] = mapped_column(JSONB, default=dict)
    search_tsv: Mapped[str | None] = mapped_column(
        TSVECTOR,
        Computed(
            "to_tsvector('english', coalesce(quote_text, '') || ' ' || coalesce(body_text, ''))",
            persisted=True,
        ),
        nullable=True,
    )
