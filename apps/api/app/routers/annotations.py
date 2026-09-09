import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from ..db import get_db
from ..deps import get_current_user
from ..models import Annotation, Document, User
from ..schemas.annotation import AnnotationCreateRequest, AnnotationOut, AnnotationUpdateRequest

router = APIRouter(tags=["annotations"])


def _get_owned_document(db: DBSession, document_id: uuid.UUID, user: User) -> Document:
    document = db.query(Document).filter(Document.id == document_id, Document.owner_id == user.id).first()
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    return document


@router.get("/documents/{document_id}/annotations", response_model=list[AnnotationOut])
def list_annotations(
    document_id: uuid.UUID, db: DBSession = Depends(get_db), user: User = Depends(get_current_user)
) -> list[Annotation]:
    _get_owned_document(db, document_id, user)
    return (
        db.query(Annotation)
        .filter(Annotation.document_id == document_id, Annotation.user_id == user.id)
        .order_by(Annotation.created_at.asc())
        .all()
    )


@router.post(
    "/documents/{document_id}/annotations",
    response_model=AnnotationOut,
    status_code=status.HTTP_201_CREATED,
)
def create_annotation(
    document_id: uuid.UUID,
    payload: AnnotationCreateRequest,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Annotation:
    _get_owned_document(db, document_id, user)
    annotation = Annotation(
        document_id=document_id,
        user_id=user.id,
        device_id=payload.device_id,
        type=payload.type.value,
        page_number=payload.page_number,
        color=payload.color,
        quote_text=payload.quote_text,
        body_text=payload.body_text,
        data=payload.data,
    )
    db.add(annotation)
    db.commit()
    db.refresh(annotation)
    return annotation


@router.patch("/annotations/{annotation_id}", response_model=AnnotationOut)
def update_annotation(
    annotation_id: uuid.UUID,
    payload: AnnotationUpdateRequest,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Annotation:
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id, Annotation.user_id == user.id).first()
    if annotation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Annotation not found")
    if payload.body_text is not None:
        annotation.body_text = payload.body_text
    if payload.color is not None:
        annotation.color = payload.color
    db.commit()
    db.refresh(annotation)
    return annotation


@router.delete("/annotations/{annotation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_annotation(
    annotation_id: uuid.UUID, db: DBSession = Depends(get_db), user: User = Depends(get_current_user)
) -> None:
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id, Annotation.user_id == user.id).first()
    if annotation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Annotation not found")
    db.delete(annotation)
    db.commit()
