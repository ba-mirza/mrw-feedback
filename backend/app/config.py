from functools import lru_cache
from zoneinfo import ZoneInfo

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

LEGACY_PG_SCHEME = "postgresql://"
PSYCOPG2_PG_SCHEME = "postgresql+psycopg2://"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "feedback-service"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "sqlite:///./feedback.db"
    SECRET_KEY: str = "dev-secret-change-me"
    ACCESS_TOKEN_TTL_MINUTES: int = 720
    SURVEY_BASE_URL: str = "http://localhost:5175"
    TIMEZONE: str = "Asia/Almaty"
    SESSION_RESUME_MINUTES: int = 30
    REPEAT_WINDOW_HOURS: int = 12
    CORS_ORIGINS: list[str] = []
    ENABLE_API_DOCS: bool = True

    @field_validator("DATABASE_URL")
    @classmethod
    def use_psycopg2_driver(cls, value: str) -> str:
        if value.startswith(LEGACY_PG_SCHEME):
            return PSYCOPG2_PG_SCHEME + value.removeprefix(LEGACY_PG_SCHEME)
        return value

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def zone(self) -> ZoneInfo:
        return ZoneInfo(self.TIMEZONE)


@lru_cache
def get_settings() -> Settings:
    return Settings()


def validate_production_settings(settings: Settings) -> None:
    if not settings.is_production:
        return
    if settings.SECRET_KEY == Settings.model_fields["SECRET_KEY"].default or len(settings.SECRET_KEY) < 32:
        raise RuntimeError("SECRET_KEY must be set to a random value of at least 32 characters in production")
    if settings.DATABASE_URL.startswith("sqlite"):
        raise RuntimeError("DATABASE_URL must point to PostgreSQL in production")
