from functools import lru_cache
from typing import Literal

from pydantic import AnyUrl, Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "MachinaAI API"
    environment: Literal["local", "development", "staging", "production", "test"] = "local"
    debug: bool = False

    api_v1_prefix: str = "/api/v1"

    database_url: PostgresDsn | str = Field(
        default="postgresql+psycopg://machinaai:machinaai@localhost:5432/machinaai",
        description="SQLAlchemy-compatible PostgreSQL connection URL.",
    )

    jwt_secret_key: str = Field(
        default="change-me-in-production",
        min_length=16,
        description="Secret used to sign JWT access tokens.",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    cors_origins: list[AnyUrl | str] = []

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str] | list[AnyUrl | str]:
        if isinstance(value, str) and value:
            return [origin.strip() for origin in value.split(",")]
        if value == "":
            return []
        return value


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""

    return Settings()
