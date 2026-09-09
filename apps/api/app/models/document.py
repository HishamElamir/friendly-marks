import uuid
from enum import StrEnum

from sqlalchemy import BigInteger, Computed, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import TSVECTOR, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base
from .mixins import TimestampMixin, UUIDPKMixin


class DocumentCategory(StrEnum):
    PAPER = "paper"
    TEXTBOOK = "textbook"
    BOOK = "book"
    TRANSCRIPT = "transcript"
    OTHER = "other"


class DocumentStatus(StrEnum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"


class Document(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "documents"

    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(300))
    authors: Mapped[str | None] = mapped_column(String(300), nullable=True)
    category: Mapped[str] = mapped_column(String(16), default=DocumentCategory.OTHER.value)
    storage_key: Mapped[str] = mapped_column(String(500))
    original_filename: Mapped[str] = mapped_column(String(300))
    content_type: Mapped[str] = mapped_column(String(120), default="application/pdf")
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default=DocumentStatus.UPLOADING.value, index=True)


class DocumentPage(UUIDPKMixin, Base):
    __tablename__ = "document_pages"
    __table_args__ = (
        UniqueConstraint("document_id", "page_number", name="uq_document_page"),
        Index("ix_document_pages_text_tsv", "text_tsv", postgresql_using="gin"),
    )

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    page_number: Mapped[int] = mapped_column(Integer)
    extracted_text: Mapped[str] = mapped_column(Text, default="")
    text_tsv: Mapped[str | None] = mapped_column(
        TSVECTOR, Computed("to_tsvector('english', extracted_text)", persisted=True), nullable=True
    )
