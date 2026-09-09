from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

from ..db import get_db
from ..deps import get_current_user
from ..models import Annotation, Document, DocumentPage, User
from ..schemas.search import MarkMatch, PageMatch, SearchResponse

router = APIRouter(tags=["search"])

_MAX_RESULTS = 20
_SNIPPET_OPTIONS = "MaxWords=20, MinWords=8, StartSel=<mark>, StopSel=</mark>"


@router.get("/search", response_model=SearchResponse)
def search(
    q: str = Query(min_length=1, max_length=200),
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SearchResponse:
    tsquery = func.plainto_tsquery("english", q)

    page_rows = (
        db.query(
            DocumentPage.document_id,
            Document.title,
            DocumentPage.page_number,
            func.ts_headline("english", DocumentPage.extracted_text, tsquery, _SNIPPET_OPTIONS),
        )
        .join(Document, Document.id == DocumentPage.document_id)
        .filter(Document.owner_id == user.id, DocumentPage.text_tsv.op("@@")(tsquery))
        .order_by(func.ts_rank(DocumentPage.text_tsv, tsquery).desc())
        .limit(_MAX_RESULTS)
        .all()
    )
    pages = [
        PageMatch(document_id=doc_id, document_title=title, page_number=page_no, snippet=snippet)
        for doc_id, title, page_no, snippet in page_rows
    ]

    mark_rows = (
        db.query(
            Annotation.id,
            Annotation.document_id,
            Document.title,
            Annotation.type,
            Annotation.page_number,
            func.ts_headline(
                "english",
                func.coalesce(Annotation.quote_text, "") + " " + func.coalesce(Annotation.body_text, ""),
                tsquery,
                _SNIPPET_OPTIONS,
            ),
        )
        .join(Document, Document.id == Annotation.document_id)
        .filter(Annotation.user_id == user.id, Annotation.search_tsv.op("@@")(tsquery))
        .order_by(func.ts_rank(Annotation.search_tsv, tsquery).desc())
        .limit(_MAX_RESULTS)
        .all()
    )
    marks = [
        MarkMatch(
            annotation_id=ann_id,
            document_id=doc_id,
            document_title=title,
            type=ann_type,
            page_number=page_no,
            snippet=snippet,
        )
        for ann_id, doc_id, title, ann_type, page_no, snippet in mark_rows
    ]

    return SearchResponse(pages=pages, marks=marks)
