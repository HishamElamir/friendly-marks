import time

import fitz
import requests


def _signup(client, email: str, name: str) -> None:
    resp = client.post(
        "/auth/signup",
        json={"email": email, "password": "correcthorsebattery", "display_name": name},
    )
    assert resp.status_code == 201, resp.text


def _make_pdf_bytes(pages_text: list[str]) -> bytes:
    doc = fitz.open()
    for text in pages_text:
        page = doc.new_page()
        page.insert_text((72, 72), text)
    data = doc.tobytes()
    doc.close()
    return data


def test_full_upload_extraction_and_authorization(client):
    _signup(client, "owner@example.com", "Doc Owner")

    create_resp = client.post(
        "/documents",
        json={
            "title": "Attention Without Anxiety",
            "authors": "R. Okonjo",
            "category": "paper",
            "filename": "attention.pdf",
            "content_type": "application/pdf",
        },
    )
    assert create_resp.status_code == 201, create_resp.text
    body = create_resp.json()
    document_id = body["document_id"]
    upload_url = body["upload_url"]
    assert "X-Amz-Signature" in upload_url

    pdf_bytes = _make_pdf_bytes(["Selectivity beats volume in annotation.", "The margin is a place to argue."])
    put_resp = requests.put(upload_url, data=pdf_bytes, headers={"Content-Type": "application/pdf"})
    assert put_resp.status_code == 200, put_resp.text

    complete_resp = client.post(f"/documents/{document_id}/complete")
    assert complete_resp.status_code == 200, complete_resp.text
    assert complete_resp.json()["status"] == "processing"

    # extraction runs as a FastAPI BackgroundTask after the response is sent;
    # poll briefly for it to land rather than assuming it's instant.
    for _ in range(20):
        doc = client.get(f"/documents/{document_id}").json()
        if doc["status"] == "ready":
            break
        time.sleep(0.1)
    assert doc["status"] == "ready", doc
    assert doc["page_count"] == 2

    file_url_resp = client.get(f"/documents/{document_id}/file-url")
    assert file_url_resp.status_code == 200
    fetched = requests.get(file_url_resp.json()["url"])
    assert fetched.content == pdf_bytes

    listing = client.get("/documents").json()
    assert any(d["id"] == document_id for d in listing)

    search_resp = client.get("/search", params={"q": "selectivity"})
    assert search_resp.status_code == 200
    pages = search_resp.json()["pages"]
    assert any(p["document_id"] == document_id for p in pages)

    # --- authorization boundary: a second user must not see or reach this document ---
    other_client = client.__class__(client.app)
    _signup(other_client, "intruder@example.com", "Intruder")

    other_list = other_client.get("/documents").json()
    assert all(d["id"] != document_id for d in other_list)

    other_get = other_client.get(f"/documents/{document_id}")
    assert other_get.status_code == 404

    other_delete = other_client.delete(f"/documents/{document_id}")
    assert other_delete.status_code == 404

    other_search = other_client.get("/search", params={"q": "selectivity"})
    assert all(p["document_id"] != document_id for p in other_search.json()["pages"])

    delete_resp = client.delete(f"/documents/{document_id}")
    assert delete_resp.status_code == 204
    assert client.get(f"/documents/{document_id}").status_code == 404
