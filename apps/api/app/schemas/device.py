import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from ..models.device import DeviceType


class DeviceRegisterRequest(BaseModel):
    client_device_id: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=120)
    device_type: DeviceType = DeviceType.OTHER


class DeviceRenameRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    client_device_id: str
    name: str
    device_type: str
    last_document_id: uuid.UUID | None
    last_page: int | None
    last_active_at: datetime | None
