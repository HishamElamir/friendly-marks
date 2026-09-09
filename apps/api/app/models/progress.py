import uuid

from sqlalchemy import Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base
from .mixins import TimestampMixin, UUIDPKMixin


class ReadingProgress(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "reading_progress"
    __table_args__ = (UniqueConstraint("user_id", "document_id", name="uq_progress_user_document"),)

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    page_number: Mapped[int] = mapped_column(Integer, default=1)
    percent: Mapped[float] = mapped_column(Float, default=0.0)
    device_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("devices.id", ondelete="SET NULL"), nullable=True
    )
