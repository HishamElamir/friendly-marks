from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://friendly_marks:friendly_marks_dev_password@localhost:5432/friendly_marks"

    minio_endpoint: str = "localhost:9000"
    minio_public_endpoint: str = "localhost:9000"
    minio_root_user: str = "friendly_marks_admin"
    minio_root_password: str = "friendly_marks_dev_password"
    minio_bucket: str = "friendly-marks-documents"
    minio_use_ssl: bool = False

    api_secret_key: str = "dev-secret"
    api_cors_origins: str = "http://localhost:5173"
    session_cookie_name: str = "fm_session"
    session_ttl_days: int = 30

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.api_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
