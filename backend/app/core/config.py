from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load .env from backend directory (so it works from project root or backend dir)
_BACKEND_DIRECTORY_PATH = Path(__file__).resolve().parent.parent.parent
_ENV_FILE_PATH = _BACKEND_DIRECTORY_PATH / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE_PATH),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/master_plan",
        description="PostgreSQL connection string (postgresql+asyncpg://...)",
    )
    DB_POOL_SIZE: int = Field(default=10, description="Database connection pool size")
    DB_MAX_OVERFLOW: int = Field(
        default=20,
        description="Maximum overflow connections beyond pool_size",
    )
    DB_POOL_TIMEOUT: int = Field(
        default=30,
        description="Timeout for getting connection from pool (seconds)",
    )

    # Auth
    SECRET_KEY: str = Field(
        default="change-me-in-production",
        description="Secret key for JWT signing",
    )
    ALGORITHM: str = Field(
        default="HS256",
        description="JWT signing algorithm",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60,
        description="Access token validity in minutes",
    )

    # AI (OpenAI-compatible)
    AI_BASE_URL: str = Field(
        default="https://api.openai.com/v1",
        description="Base URL for AI API",
    )
    AI_API_KEY: str = Field(
        default="",
        description="API key for AI service",
    )
    AI_MODEL: str = Field(
        default="gpt-4o-mini",
        description="AI model name",
    )

    # File upload
    UPLOAD_DIR: str = Field(
        default="./uploads",
        description="Directory for uploaded files",
    )
    MAX_FILE_SIZE: int = Field(
        default=10 * 1024 * 1024,  # 10MB
        description="Maximum file upload size in bytes",
    )

    # CORS
    CORS_ORIGINS_STR: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        description="Comma-separated CORS origins",
        validation_alias="CORS_ORIGINS",
    )


settings = Settings()
