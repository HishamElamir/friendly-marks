import fitz  # PyMuPDF


def extract_pages(pdf_bytes: bytes) -> list[str]:
    """Returns extracted plain text for each page, in order. Used only for search
    indexing — the frontend renders the PDF itself via pdfjs-dist."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        return [page.get_text() for page in doc]
    finally:
        doc.close()


def page_count(pdf_bytes: bytes) -> int:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        return doc.page_count
    finally:
        doc.close()
