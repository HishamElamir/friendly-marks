import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

from ..db import get_db
from ..deps import get_current_user
from ..models import Annotation, Document, DocumentPage, ReadingProgress, User
from ..models.document import DocumentStatus
from ..schemas.document import (
    DocumentCreateRequest,
    DocumentCreateResponse,
    DocumentFileUrlOut,
    DocumentOut,
)
from ..services import storage
from ..services.extraction import extract_pages

router = APIRouter(prefix="/documents", tags=["documents"])


def _to_out(document: Document, marks_count: int, progress: ReadingProgress | None) -> DocumentOut:
    return DocumentOut(
        id=document.id,
        title=document.title,
        authors=document.authors,
        category=document.category,
        original_filename=document.original_filename,
        file_size_bytes=document.file_size_bytes,
        page_count=document.page_count,
        status=document.status,
        created_at=document.created_at,
        updated_at=document.updated_at,
        marks_count=marks_count,
        progress_percent=progress.percent if progress else 0.0,
        progress_page=progress.page_number if progress else 1,
    )


@router.get("", response_model=list[DocumentOut])
def list_documents(
    category: str | None = None,
    marked_up: bool | None = None,
    q: str | None = None,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[DocumentOut]:
    query = db.query(Document).filter(Document.owner_id == user.id)
    if category:
        query = query.filter(Document.category == category)
    if q:
        query = query.filter(Document.title.ilike(f"%{q}%"))
    documents = query.order_by(Document.updated_at.desc()).all()

    if not documents:
        return []

    doc_ids = [d.id for d in documents]
    counts = dict(
        db.query(Annotation.document_id, func.count(Annotation.id))
        .filter(Annotation.document_id.in_(doc_ids))
        .group_by(Annotation.document_id)
        .all()
    )
    progresses = {
        p.document_id: p
        for p in db.query(ReadingProgress).filter(
            ReadingProgress.document_id.in_(doc_ids), ReadingProgress.user_id == user.id
        )
    }

    out = [_to_out(d, counts.get(d.id, 0), progresses.get(d.id)) for d in documents]
    if marked_up is True:
        out = [o for o in out if o.marks_count > 0]
    elif marked_up is False:
        out = [o for o in out if o.marks_count == 0]
    return out


@router.post("", response_model=DocumentCreateResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: DocumentCreateRequest,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DocumentCreateResponse:
    document = Document(
        owner_id=user.id,
        title=payload.title,
        authors=payload.authors,
        category=payload.category.value,
        original_filename=payload.filename,
        content_type=payload.content_type,
        status=DocumentStatus.UPLOADING.value,
        storage_key="",  # set below once we know the id
    )
    db.add(document)
    db.flush()
    document.storage_key = storage.new_storage_key(document.id, payload.filename)
    db.commit()
    db.refresh(document)

    upload_url = storage.presigned_put_url(document.storage_key, payload.content_type)
    return DocumentCreateResponse(document_id=document.id, upload_url=upload_url)


def _run_extraction(document_id: uuid.UUID, database_url: str) -> None:
    # Runs in a FastAPI BackgroundTask after the response has been sent, so it
    # needs its own short-lived DB session rather than the request's.
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if document is None:
            return
        try:
            pdf_bytes = storage.fetch_object_bytes(document.storage_key)
            pages = extract_pages(pdf_bytes)
            db.query(DocumentPage).filter(DocumentPage.document_id == document.id).delete()
            for i, text in enumerate(pages, start=1):
                db.add(DocumentPage(document_id=document.id, page_number=i, extracted_text=text))
            document.page_count = len(pages)
            document.status = DocumentStatus.READY.value
        except Exception:
            document.status = DocumentStatus.ERROR.value
        db.commit()
    finally:
        db.close()
        engine.dispose()


@router.post("/{document_id}/complete", response_model=DocumentOut)
def complete_upload(
    document_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DocumentOut:
    document = db.query(Document).filter(Document.id == document_id, Document.owner_id == user.id).first()
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")

    document.status = DocumentStatus.PROCESSING.value
    db.commit()
    db.refresh(document)

    from ..config import get_settings

    background_tasks.add_task(_run_extraction, document.id, get_settings().database_url)
    return _to_out(document, 0, None)


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: uuid.UUID, db: DBSession = Depends(get_db), user: User = Depends(get_current_user)
) -> DocumentOut:
    document = db.query(Document).filter(Document.id == document_id, Document.owner_id == user.id).first()
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    marks_count = db.query(func.count(Annotation.id)).filter(Annotation.document_id == document.id).scalar() or 0
    progress = (
        db.query(ReadingProgress)
        .filter(ReadingProgress.document_id == document.id, ReadingProgress.user_id == user.id)
        .first()
    )
    return _to_out(document, marks_count, progress)


@router.get("/{document_id}/file-url", response_model=DocumentFileUrlOut)
def get_file_url(
    document_id: uuid.UUID, db: DBSession = Depends(get_db), user: User = Depends(get_current_user)
) -> DocumentFileUrlOut:
    document = db.query(Document).filter(Document.id == document_id, Document.owner_id == user.id).first()
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    return DocumentFileUrlOut(url=storage.presigned_get_url(document.storage_key))


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: uuid.UUID, db: DBSession = Depends(get_db), user: User = Depends(get_current_user)
) -> None:
    document = db.query(Document).filter(Document.id == document_id, Document.owner_id == user.id).first()
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    storage.delete_object(document.storage_key)
    db.delete(document)
    db.commit()
