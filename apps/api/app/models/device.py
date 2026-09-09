import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base
from .mixins import UUIDPKMixin


class DeviceType(StrEnum):
    DESKTOP = "desktop"
    TABLET = "tablet"
    PHONE = "phone"
    OTHER = "other"


class Device(UUIDPKMixin, Base):
    __tablename__ = "devices"
    __table_args__ = (UniqueConstraint("user_id", "client_device_id", name="uq_device_user_client"),)

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    client_device_id: Mapped[str] = mapped_column(String(64))
    name: Mapped[str] = mapped_column(String(120))
    device_type: Mapped[str] = mapped_column(String(16), default=DeviceType.OTHER.value)

    last_document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
    last_page: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_active_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default="now()")
