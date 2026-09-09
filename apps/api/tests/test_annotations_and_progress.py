import uuid

import fitz
import requests


def _signup_and_create_document(client) -> str:
    email = f"annotator-{uuid.uuid4().hex[:8]}@example.com"
    client.post(
        "/auth/signup",
        json={"email": email, "password": "correcthorsebattery", "display_name": "Annotator"},
    )
    create_resp = client.post(
        "/documents",
        json={
            "title": "Notes on Distributed Systems",
            "category": "paper",
            "filename": "notes.pdf",
            "content_type": "application/pdf",
        },
    )
    body = create_resp.json()
    doc = fitz.open()
    doc.new_page().insert_text((72, 72), "placeholder")
    pdf_bytes = doc.tobytes()
    doc.close()
    requests.put(body["upload_url"], data=pdf_bytes, headers={"Content-Type": "application/pdf"})
    client.post(f"/documents/{body['document_id']}/complete")
    return body["document_id"]


def test_highlight_note_stroke_lifecycle(client):
    document_id = _signup_and_create_document(client)

    device_resp = client.post(
        "/devices/register",
        json={"client_device_id": "dev-1", "name": "MacBook Pro", "device_type": "desktop"},
    )
    device_id = device_resp.json()["id"]

    highlight_resp = client.post(
        f"/documents/{document_id}/annotations",
        json={
            "type": "highlight",
            "page_number": 1,
            "color": "#ffd97a",
            "quote_text": "selectivity predicted almost everything",
            "data": {"rects": [{"xPct": 10.0, "yPct": 20.0, "wPct": 30.0, "hPct": 3.0}]},
            "device_id": device_id,
        },
    )
    assert highlight_resp.status_code == 201, highlight_resp.text

    # invalid shape: highlight with no rects must be rejected
    bad_resp = client.post(
        f"/documents/{document_id}/annotations",
        json={"type": "highlight", "page_number": 1, "data": {"rects": []}},
    )
    assert bad_resp.status_code == 422

    note_resp = client.post(
        f"/documents/{document_id}/annotations",
        json={
            "type": "note",
            "page_number": 1,
            "data": {"xPct": 74.0, "yPct": 46.0},
            "body_text": "",
        },
    )
    note_id = note_resp.json()["id"]

    stroke_resp = client.post(
        f"/documents/{document_id}/annotations",
        json={
            "type": "stroke",
            "page_number": 1,
            "color": "#c67139",
            "data": {"xPct": 5.0, "yPct": 5.0, "w": 3, "path": "M5 5 L20 20"},
        },
    )
    assert stroke_resp.status_code == 201

    listing = client.get(f"/documents/{document_id}/annotations").json()
    assert len(listing) == 3

    edit_resp = client.patch(f"/annotations/{note_id}", json={"body_text": "Selectivity > volume."})
    assert edit_resp.status_code == 200
    assert edit_resp.json()["body_text"] == "Selectivity > volume."

    delete_resp = client.delete(f"/annotations/{note_id}")
    assert delete_resp.status_code == 204
    listing_after = client.get(f"/documents/{document_id}/annotations").json()
    assert len(listing_after) == 2

    doc_after = client.get(f"/documents/{document_id}").json()
    assert doc_after["marks_count"] == 2


def test_progress_updates_document_and_device(client):
    document_id = _signup_and_create_document(client)
    device_resp = client.post(
        "/devices/register",
        json={"client_device_id": "dev-progress", "name": "iPad", "device_type": "tablet"},
    )
    device_id = device_resp.json()["id"]

    put_resp = client.put(
        f"/documents/{document_id}/progress",
        json={"page_number": 15, "percent": 62.0, "device_id": device_id},
    )
    assert put_resp.status_code == 200
    assert put_resp.json() == {"document_id": document_id, "page_number": 15, "percent": 62.0}

    doc = client.get(f"/documents/{document_id}").json()
    assert doc["progress_page"] == 15
    assert doc["progress_percent"] == 62.0

    devices = client.get("/devices").json()
    matching = next(d for d in devices if d["id"] == device_id)
    assert matching["last_document_id"] == document_id
    assert matching["last_page"] == 15

    # upsert: a second update to the same document/user overwrites, not duplicates
    client.put(f"/documents/{document_id}/progress", json={"page_number": 20, "percent": 80.0})
    doc2 = client.get(f"/documents/{document_id}").json()
    assert doc2["progress_page"] == 20
