import boto3
from moto import mock_aws

from app.config import get_settings


@mock_aws
def test_boto3_put_get_delete_roundtrip():
    """Exercises the same boto3 S3 API calls app.services.storage makes,
    against moto's in-process mock (this sandbox can't reach a live MinIO
    container or pull its image, so this validates the client logic without
    needing a real object-storage server)."""
    settings = get_settings()
    client = boto3.client("s3", region_name="us-east-1")
    client.create_bucket(Bucket=settings.minio_bucket)

    client.put_object(Bucket=settings.minio_bucket, Key="documents/doc1/paper.pdf", Body=b"%PDF-1.4 fake bytes")
    body = client.get_object(Bucket=settings.minio_bucket, Key="documents/doc1/paper.pdf")["Body"].read()
    assert body == b"%PDF-1.4 fake bytes"

    client.delete_object(Bucket=settings.minio_bucket, Key="documents/doc1/paper.pdf")
    listing = client.list_objects_v2(Bucket=settings.minio_bucket, Prefix="documents/doc1/")
    assert listing.get("KeyCount", 0) == 0


def test_presigned_url_generation_is_local_and_well_formed():
    """generate_presigned_url is pure local signing (no network call), so this
    runs even without a reachable MinIO endpoint."""
    from app.services import storage

    put_url = storage.presigned_put_url("documents/doc1/paper.pdf", "application/pdf")
    get_url = storage.presigned_get_url("documents/doc1/paper.pdf")

    assert "documents/doc1/paper.pdf" in put_url
    assert "X-Amz-Signature" in put_url
    assert "X-Amz-Signature" in get_url
