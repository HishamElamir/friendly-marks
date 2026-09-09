import os

MOTO_PORT = 9099

os.environ["DATABASE_URL"] = (
    "postgresql+psycopg://friendly_marks:friendly_marks_dev_password@localhost:5432/friendly_marks_test"
)
os.environ["MINIO_BUCKET"] = "friendly-marks-test"
os.environ["MINIO_ENDPOINT"] = f"localhost:{MOTO_PORT}"
os.environ["MINIO_PUBLIC_ENDPOINT"] = f"localhost:{MOTO_PORT}"

import boto3
import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from moto.moto_server.threaded_moto_server import ThreadedMotoServer
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import get_settings
from app.main import app

API_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@pytest.fixture(scope="session", autouse=True)
def _moto_s3_server():
    """A real HTTP server implementing the S3 API (moto's server mode, not its
    boto3-call-interception mode) — this sandbox can't reach a live MinIO
    container, so this stands in as something app.services.storage's presigned
    URLs can actually be PUT/GET against over real HTTP, exactly like MinIO."""
    server = ThreadedMotoServer(ip_address="127.0.0.1", port=MOTO_PORT, verbose=False)
    server.start()
    yield
    server.stop()


@pytest.fixture(scope="session", autouse=True)
def _migrated_db(_moto_s3_server):
    get_settings.cache_clear()
    settings = get_settings()
    cfg = Config(os.path.join(API_DIR, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(API_DIR, "alembic"))
    cfg.set_main_option("sqlalchemy.url", settings.database_url)
    command.downgrade(cfg, "base")
    command.upgrade(cfg, "head")

    boto3.client(
        "s3",
        endpoint_url=f"http://127.0.0.1:{MOTO_PORT}",
        aws_access_key_id=settings.minio_root_user,
        aws_secret_access_key=settings.minio_root_password,
        region_name="us-east-1",
    ).create_bucket(Bucket=settings.minio_bucket)
    yield


@pytest.fixture
def db_session():
    settings = get_settings()
    engine = create_engine(settings.database_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    engine.dispose()


@pytest.fixture
def client():
    return TestClient(app)
