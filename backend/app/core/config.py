import os
import warnings
from typing import Any, List, Optional
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.constants import ALLOWED_FILE_EXTENSIONS
from app.core.environments import EnvironmentType


class Settings(BaseSettings):
    """
    Centralized, typed Application Settings class built with Pydantic Settings v2.
    Loads and validates all configuration settings for NeuroDesk AI.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # ==================== APPLICATION SETTINGS ====================
    APP_NAME: str = Field(default="NeuroDesk AI", description="Application Name")
    APP_VERSION: str = Field(default="1.0.0", description="Semantic Application Version")
    APP_DESCRIPTION: str = Field(
        default="Production Backend for NeuroDesk AI SaaS Platform",
        description="Application Description",
    )
    API_PREFIX: str = Field(default="/api/v1", description="Global API Prefix")
    DEBUG: bool = Field(default=False, description="Debug Mode Flag")
    HOST: str = Field(default="0.0.0.0", description="Server Interface Host")
    PORT: int = Field(default=8000, description="Server Interface Port")
    ENVIRONMENT: EnvironmentType = Field(
        default=EnvironmentType.DEVELOPMENT, description="Current execution environment"
    )
    SECRET_KEY: str = Field(
        default="neurodesk_ai_dev_secret_key_change_in_production_987654321",
        description="Primary application secret key",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60 * 24 * 7, description="Access token expiration in minutes (7 days)"
    )
    FRONTEND_URL: str = Field(default="http://localhost:3000", description="Frontend Web App Base URL")
    LOG_LEVEL: str = Field(default="INFO", description="Global logging verbosity level")
    TIMEZONE: str = Field(default="UTC", description="System Timezone")

    # ==================== SECURITY SETTINGS ====================
    JWT_SECRET_KEY: str = Field(
        default="neurodesk_ai_jwt_secret_key_change_in_production_987654321",
        description="Secret key specifically for JWT signing",
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT Algorithm")
    PASSWORD_MIN_LENGTH: int = Field(default=8, description="Minimum password length constraint")
    SESSION_TIMEOUT_MINUTES: int = Field(default=60, description="Inactivity session timeout")
    ALLOWED_HOSTS: List[str] = Field(default=["*"], description="Allowed HTTP Host headers")
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        description="Allowed CORS Origins",
    )
    TRUSTED_HOSTS: List[str] = Field(
        default=["127.0.0.1", "localhost"], description="Trusted Proxies & Hosts"
    )

    # ==================== DATABASE SETTINGS ====================
    DB_HOST: str = Field(default="localhost", description="PostgreSQL DB Host")
    DB_PORT: int = Field(default=5432, description="PostgreSQL DB Port")
    DB_NAME: str = Field(default="neurodesk_db", description="PostgreSQL DB Name")
    DB_USER: str = Field(default="postgres", description="PostgreSQL DB User")
    DB_PASSWORD: str = Field(default="postgres", description="PostgreSQL DB Password")
    DATABASE_URL: Optional[str] = Field(default=None, description="Sync Database Connection URL")
    ASYNC_DATABASE_URL: Optional[str] = Field(default=None, description="Async Database Connection URL")

    # ==================== REDIS SETTINGS ====================
    REDIS_HOST: str = Field(default="localhost", description="Redis Host")
    REDIS_PORT: int = Field(default=6379, description="Redis Port")
    REDIS_PASSWORD: Optional[str] = Field(default=None, description="Redis Password")
    REDIS_DB: int = Field(default=0, description="Redis Database Index")
    REDIS_URL: Optional[str] = Field(default=None, description="Redis Connection URL")

    # ==================== CELERY SETTINGS ====================
    CELERY_BROKER_URL: Optional[str] = Field(default=None, description="Celery Broker Connection URL")
    CELERY_RESULT_BACKEND: Optional[str] = Field(default=None, description="Celery Result Backend URL")

    # ==================== AI MODEL SETTINGS ====================
    OPENAI_API_KEY: Optional[str] = Field(default=None, description="OpenAI API Key")
    GROQ_API_KEY: Optional[str] = Field(default=None, description="Groq API Key")
    GOOGLE_API_KEY: Optional[str] = Field(default=None, description="Google Gemini API Key")
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, description="Anthropic API Key")
    DEFAULT_MODEL: str = Field(default="openai/gpt-oss-120b", description="Default AI Foundation Model")
    MODEL_TEMPERATURE: float = Field(default=0.7, description="AI Sampling Temperature (0.0 - 2.0)")
    MAX_TOKENS: int = Field(default=4096, description="Max Token Generation Limit")

    # ==================== FILE STORAGE SETTINGS ====================
    UPLOAD_DIRECTORY: str = Field(default="uploads", description="Upload storage root folder")
    MAX_UPLOAD_SIZE_MB: int = Field(default=25, description="Maximum allowed file upload size in MB")
    TEMP_DIRECTORY: str = Field(default="tmp", description="Temporary file processing folder")
    ALLOWED_FILE_TYPES: List[str] = Field(
        default=ALLOWED_FILE_EXTENSIONS, description="Allowed file upload extensions"
    )

    # ==================== EMAIL SETTINGS ====================
    SMTP_HOST: str = Field(default="smtp.gmail.com", description="SMTP Mail Server Host")
    SMTP_PORT: int = Field(default=587, description="SMTP Server Port")
    SMTP_USERNAME: Optional[str] = Field(default=None, description="SMTP Auth Username")
    SMTP_PASSWORD: Optional[str] = Field(default=None, description="SMTP Auth Password")
    SMTP_TLS: bool = Field(default=True, description="Enable TLS for SMTP")
    EMAIL_FROM: str = Field(default="noreply@neurodesk.ai", description="Default From Email Address")

    # ==================== RATE LIMIT SETTINGS ====================
    REQUESTS_PER_MINUTE: int = Field(default=60, description="API Rate Limit per Minute")
    REQUESTS_PER_HOUR: int = Field(default=1000, description="API Rate Limit per Hour")

    # ==================== ANALYTICS SETTINGS ====================
    ENABLE_ANALYTICS: bool = Field(default=True, description="Global Analytics Tracking Flag")
    TRACK_USAGE: bool = Field(default=True, description="Detailed Usage Telemetry Flag")

    # ==================== FEATURE FLAGS ====================
    ENABLE_CHAT: bool = Field(default=True, description="Enable AI Chat Assistant Module")
    ENABLE_RAG: bool = Field(default=True, description="Enable RAG / Vector Search Module")
    ENABLE_DOCUMENTS: bool = Field(default=True, description="Enable Document Processing Module")
    ENABLE_TEAMS: bool = Field(default=True, description="Enable Multi-Tenant Team Management")
    ENABLE_BILLING: bool = Field(default=False, description="Enable Billing & Subscription Module")

    # ==================== VALIDATORS ====================
    @field_validator("PORT", "DB_PORT", "REDIS_PORT", "SMTP_PORT")
    @classmethod
    def validate_port_range(cls, v: int) -> int:
        if not (1 <= v <= 65535):
            raise ValueError(f"Port number {v} must be within range 1 to 65535")
        return v

    @field_validator("MODEL_TEMPERATURE")
    @classmethod
    def validate_temperature(cls, v: float) -> float:
        if not (0.0 <= v <= 2.0):
            raise ValueError(f"AI Model temperature {v} must be between 0.0 and 2.0")
        return v

    @field_validator("MAX_TOKENS", "MAX_UPLOAD_SIZE_MB", "REQUESTS_PER_MINUTE", "REQUESTS_PER_HOUR")
    @classmethod
    def validate_positive_number(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Numeric limit configuration must be greater than zero")
        return v

    @field_validator("PASSWORD_MIN_LENGTH")
    @classmethod
    def validate_password_min_length(cls, v: int) -> int:
        if v < 6:
            raise ValueError("Password minimum length constraint cannot be less than 6 characters")
        return v

    @model_validator(mode="after")
    def compute_urls_and_validate_security(self) -> "Settings":
        """
        Compute dependent URLs and perform production security assertions.
        """
        # 1. Compute Database URLs if not explicitly passed
        if self.DATABASE_URL and not self.ASYNC_DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgres://"):
                self.ASYNC_DATABASE_URL = url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgresql://"):
                self.ASYNC_DATABASE_URL = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif url.startswith("sqlite:///"):
                self.ASYNC_DATABASE_URL = url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
            else:
                self.ASYNC_DATABASE_URL = url
        elif not self.DATABASE_URL and not self.ASYNC_DATABASE_URL:
            self.DATABASE_URL = (
                f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@"
                f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )
            self.ASYNC_DATABASE_URL = (
                f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@"
                f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )

        # 2. Compute Redis URL if not explicitly passed
        if not self.REDIS_URL:
            auth = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
            self.REDIS_URL = f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

        # 3. Compute Celery URLs if not explicitly passed
        if not self.CELERY_BROKER_URL:
            self.CELERY_BROKER_URL = self.REDIS_URL
        if not self.CELERY_RESULT_BACKEND:
            self.CELERY_RESULT_BACKEND = self.REDIS_URL

        # 4. Production Security Assertions & Warnings
        if self.ENVIRONMENT == EnvironmentType.PRODUCTION:
            if self.DEBUG:
                warnings.warn("CRITICAL: DEBUG mode is enabled in PRODUCTION environment!")

            if "dev_secret_key" in self.SECRET_KEY:
                warnings.warn(
                    "SECURITY WARNING: Default SECRET_KEY detected in PRODUCTION! "
                    "Update SECRET_KEY in your production environment variables."
                )

            if "dev_secret_key" in self.JWT_SECRET_KEY:
                warnings.warn(
                    "SECURITY WARNING: Default JWT_SECRET_KEY detected in PRODUCTION! "
                    "Update JWT_SECRET_KEY in your production environment variables."
                )

        return self

    # ==================== HELPER METHODS ====================
    def is_development(self) -> bool:
        """Returns True if running in development environment."""
        return self.ENVIRONMENT == EnvironmentType.DEVELOPMENT

    def is_production(self) -> bool:
        """Returns True if running in production environment."""
        return self.ENVIRONMENT == EnvironmentType.PRODUCTION

    def is_testing(self) -> bool:
        """Returns True if running in testing environment."""
        return self.ENVIRONMENT == EnvironmentType.TESTING

    def is_debug(self) -> bool:
        """Returns True if DEBUG flag is enabled."""
        return self.DEBUG

    def get_cors_origins(self) -> List[str]:
        """
        Returns complete list of unique CORS allowed origins including FRONTEND_URL.
        """
        origins = set(self.CORS_ORIGINS)
        if self.FRONTEND_URL:
            origins.add(self.FRONTEND_URL)
        return list(origins)


# Instantiate singleton settings instance
settings = Settings()
