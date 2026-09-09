from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from ..db import get_db
from ..deps import get_current_user
from ..models import Device, User
from ..schemas.device import DeviceOut, DeviceRegisterRequest, DeviceRenameRequest

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/register", response_model=DeviceOut)
def register_device(
    payload: DeviceRegisterRequest,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Device:
    device = (
        db.query(Device)
        .filter(Device.user_id == user.id, Device.client_device_id == payload.client_device_id)
        .first()
    )
    if device is None:
        device = Device(
            user_id=user.id,
            client_device_id=payload.client_device_id,
            name=payload.name,
            device_type=payload.device_type.value,
        )
        db.add(device)
    else:
        device.name = payload.name
        device.device_type = payload.device_type.value
    device.last_active_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(device)
    return device


@router.get("", response_model=list[DeviceOut])
def list_devices(db: DBSession = Depends(get_db), user: User = Depends(get_current_user)) -> list[Device]:
    return (
        db.query(Device)
        .filter(Device.user_id == user.id)
        .order_by(Device.last_active_at.desc().nullslast())
        .all()
    )


@router.patch("/{device_id}", response_model=DeviceOut)
def rename_device(
    device_id: str,
    payload: DeviceRenameRequest,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Device:
    device = db.query(Device).filter(Device.id == device_id, Device.user_id == user.id).first()
    if device is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Device not found")
    device.name = payload.name
    db.commit()
    db.refresh(device)
    return device
