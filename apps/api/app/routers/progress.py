import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from ..db import get_db
from ..deps import get_current_user
from ..models import Device, Document, ReadingProgress, User
from ..schemas.progress import ProgressOut, ProgressUpdateRequest

router = APIRouter(prefix="/documents", tags=["progress"])


@router.put("/{document_id}/progress", response_model=ProgressOut)
def update_progress(
    document_id: uuid.UUID,
    payload: ProgressUpdateRequest,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ProgressOut:
    document = db.query(Document).filter(Document.id == document_id, Document.owner_id == user.id).first()
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")

    progress = (
        db.query(ReadingProgress)
        .filter(ReadingProgress.document_id == document_id, ReadingProgress.user_id == user.id)
        .first()
    )
    if progress is None:
        progress = ReadingProgress(document_id=document_id, user_id=user.id)
        db.add(progress)
    progress.page_number = payload.page_number
    progress.percent = payload.percent
    progress.device_id = payload.device_id

    if payload.device_id is not None:
        device = db.query(Device).filter(Device.id == payload.device_id, Device.user_id == user.id).first()
        if device is not None:
            device.last_document_id = document_id
            device.last_page = payload.page_number
            device.last_active_at = datetime.now(timezone.utc)

    db.commit()
    return ProgressOut(document_id=document_id, page_number=progress.page_number, percent=progress.percent)
