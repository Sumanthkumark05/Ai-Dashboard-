import pytest
from pydantic import ValidationError
from app.core.config import Settings
from app.core.environments import EnvironmentType


def test_default_settings_loading() -> None:
    """
    Test that default settings load with expected attributes and environments.
    """
    test_settings = Settings()
    assert test_settings.APP_NAME is not None
    assert test_settings.APP_VERSION == "1.0.0"
    assert test_settings.API_PREFIX == "/api/v1"
    assert isinstance(test_settings.ENVIRONMENT, EnvironmentType)


def test_environment_helper_methods() -> None:
    """
    Test helper methods: is_development(), is_production(), is_testing(), is_debug().
    """
    dev_settings = Settings(ENVIRONMENT=EnvironmentType.DEVELOPMENT, DEBUG=True)
    assert dev_settings.is_development() is True
    assert dev_settings.is_production() is False
    assert dev_settings.is_testing() is False
    assert dev_settings.is_debug() is True

    prod_settings = Settings(ENVIRONMENT=EnvironmentType.PRODUCTION, DEBUG=False)
    assert prod_settings.is_development() is False
    assert prod_settings.is_production() is True
    assert prod_settings.is_testing() is False
    assert prod_settings.is_debug() is False

    test_settings = Settings(ENVIRONMENT=EnvironmentType.TESTING)
    assert test_settings.is_testing() is True


def test_feature_flags() -> None:
    """
    Test feature flags defaults and overrides.
    """
    settings = Settings()
    assert settings.ENABLE_CHAT is True
    assert settings.ENABLE_RAG is True
    assert settings.ENABLE_DOCUMENTS is True
    assert settings.ENABLE_TEAMS is True
    assert settings.ENABLE_BILLING is False


def test_computed_urls() -> None:
    """
    Test computed database, redis, and celery URLs when not explicitly set.
    """
    settings = Settings(
        DB_HOST="postgres.local",
        DB_PORT=5432,
        DB_NAME="testdb",
        DB_USER="myuser",
        DB_PASSWORD="mypassword",
        REDIS_HOST="redis.local",
        REDIS_PORT=6379,
    )
    assert settings.DATABASE_URL == "postgresql://myuser:mypassword@postgres.local:5432/testdb"
    assert (
        settings.ASYNC_DATABASE_URL
        == "postgresql+asyncpg://myuser:mypassword@postgres.local:5432/testdb"
    )
    assert settings.REDIS_URL == "redis://redis.local:6379/0"
    assert settings.CELERY_BROKER_URL == "redis://redis.local:6379/0"
    assert settings.CELERY_RESULT_BACKEND == "redis://redis.local:6379/0"


def test_cors_origins_helper() -> None:
    """
    Test get_cors_origins helper includes FRONTEND_URL.
    """
    settings = Settings(
        FRONTEND_URL="http://localhost:3000",
        CORS_ORIGINS=["http://localhost:3000", "https://app.neurodesk.ai"],
    )
    origins = settings.get_cors_origins()
    assert "http://localhost:3000" in origins
    assert "https://app.neurodesk.ai" in origins


def test_validation_errors() -> None:
    """
    Test validation errors on out-of-range configuration values.
    """
    # Invalid Port Number (> 65535)
    with pytest.raises(ValidationError):
        Settings(PORT=70000)

    # Invalid Temperature (> 2.0)
    with pytest.raises(ValidationError):
        Settings(MODEL_TEMPERATURE=3.5)

    # Invalid Negative Tokens
    with pytest.raises(ValidationError):
        Settings(MAX_TOKENS=-100)

    # Invalid Negative Upload Size
    with pytest.raises(ValidationError):
        Settings(MAX_UPLOAD_SIZE_MB=0)

    # Invalid Short Password Min Length (< 6)
    with pytest.raises(ValidationError):
        Settings(PASSWORD_MIN_LENGTH=3)
