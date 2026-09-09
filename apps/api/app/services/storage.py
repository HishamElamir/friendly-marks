import uuid

import boto3
from botocore.client import Config

from ..config import get_settings

settings = get_settings()

_PRESIGN_EXPIRY_SECONDS = 15 * 60


def _client(endpoint: str):
    scheme = "https" if settings.minio_use_ssl else "http"
    return boto3.client(
        "s3",
        endpoint_url=f"{scheme}://{endpoint}",
        aws_access_key_id=settings.minio_root_user,
        aws_secret_access_key=settings.minio_root_password,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


# Two clients: one that talks to the internal docker-compose hostname (used for
# server-side operations like ensuring the bucket exists), and one whose presigned
# URLs are signed for the endpoint a *browser* can actually reach.
_internal_client = _client(settings.minio_endpoint)
_public_client = _client(settings.minio_public_endpoint)


def new_storage_key(document_id: uuid.UUID, filename: str) -> str:
    safe_name = filename.replace("/", "_")
    return f"documents/{document_id}/{safe_name}"


def presigned_put_url(storage_key: str, content_type: str) -> str:
    return _public_client.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.minio_bucket, "Key": storage_key, "ContentType": content_type},
        ExpiresIn=_PRESIGN_EXPIRY_SECONDS,
    )


def presigned_get_url(storage_key: str) -> str:
    return _public_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.minio_bucket, "Key": storage_key},
        ExpiresIn=_PRESIGN_EXPIRY_SECONDS,
    )


def fetch_object_bytes(storage_key: str) -> bytes:
    """Server-side read, used only by the background text-extraction job."""
    obj = _internal_client.get_object(Bucket=settings.minio_bucket, Key=storage_key)
    return obj["Body"].read()


def delete_object(storage_key: str) -> None:
    _internal_client.delete_object(Bucket=settings.minio_bucket, Key=storage_key)
