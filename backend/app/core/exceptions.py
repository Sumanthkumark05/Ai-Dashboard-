from typing import Any, Dict
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from loguru import logger


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    Centralized handler for HTTP exceptions (404, 403, 401, 400 etc.).
    Always surfaces the real `detail` message to the client.
    """
    request_id = getattr(request.state, "request_id", None)
    logger.warning(
        f"HTTP {exc.status_code} on {request.method} {request.url.path}: {exc.detail}"
    )

    message = exc.detail if isinstance(exc.detail, str) else "HTTP Exception occurred"

    response_payload: Dict[str, Any] = {
        "success": False,
        "message": message,
        "error": {"code": f"HTTP_{exc.status_code}", "detail": exc.detail},
    }
    if request_id:
        response_payload["request_id"] = request_id

    return JSONResponse(
        status_code=exc.status_code,
        content=response_payload,
        headers=getattr(exc, "headers", None),
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Centralized handler for Pydantic / FastAPI request validation errors (422).
    """
    request_id = getattr(request.state, "request_id", None)
    errors = exc.errors()
    logger.warning(
        f"Validation error on {request.method} {request.url.path}: {errors}"
    )

    # Build a human-readable first-error message
    first_msg = "Invalid request."
    if errors:
        first_err = errors[0]
        field = " → ".join(str(loc) for loc in first_err.get("loc", []))
        first_msg = f"{field}: {first_err.get('msg', 'invalid')}" if field else first_err.get("msg", "invalid")

    response_payload: Dict[str, Any] = {
        "success": False,
        "message": first_msg,
        "error": {"code": "VALIDATION_ERROR", "detail": errors},
    }
    if request_id:
        response_payload["request_id"] = request_id

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response_payload,
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all handler for truly unexpected errors.
    Classifies common infrastructure failures (DB, Redis) and returns
    a structured, developer-friendly message without exposing raw tracebacks.
    """
    request_id = getattr(request.state, "request_id", None)

    # Log the full traceback on the server side
    logger.exception(
        f"Unhandled exception on {request.method} {request.url.path}: {type(exc).__name__}: {exc}"
    )

    # ── Classify infrastructure errors into useful client messages ──────────
    exc_str = str(exc).lower()
    exc_type = type(exc).__name__

    if "connection refused" in exc_str or "connect call failed" in exc_str:
        if "5432" in exc_str or "postgres" in exc_str or "asyncpg" in exc_type.lower():
            user_message = (
                "Database connection failed. "
                "PostgreSQL is not reachable at the configured host/port. "
                "Please start PostgreSQL and retry."
            )
            error_code = "DB_CONNECTION_REFUSED"
        elif "6379" in exc_str or "redis" in exc_str:
            user_message = (
                "Cache service connection failed. "
                "Redis is not reachable at the configured host/port."
            )
            error_code = "REDIS_CONNECTION_REFUSED"
        else:
            user_message = "A required service is not reachable. Please check server dependencies."
            error_code = "SERVICE_UNAVAILABLE"
        http_status = status.HTTP_503_SERVICE_UNAVAILABLE

    elif "could not translate host name" in exc_str or "name or service not known" in exc_str:
        user_message = "Database host could not be resolved. Please verify DATABASE_URL configuration."
        error_code = "DB_HOST_UNRESOLVABLE"
        http_status = status.HTTP_503_SERVICE_UNAVAILABLE

    elif "password authentication failed" in exc_str or "authentication failed" in exc_str:
        user_message = "Database authentication failed. Please verify DB_USER and DB_PASSWORD."
        error_code = "DB_AUTH_FAILED"
        http_status = status.HTTP_503_SERVICE_UNAVAILABLE

    elif "database" in exc_str and ("does not exist" in exc_str or "unknown database" in exc_str):
        user_message = (
            "Database not found. Please create the database and run Alembic migrations: "
            "'alembic upgrade head'."
        )
        error_code = "DB_NOT_FOUND"
        http_status = status.HTTP_503_SERVICE_UNAVAILABLE

    elif "operationalerror" in exc_type.lower() or "databaseerror" in exc_type.lower():
        user_message = "A database error occurred. Please check the server logs."
        error_code = "DB_OPERATIONAL_ERROR"
        http_status = status.HTTP_503_SERVICE_UNAVAILABLE

    else:
        user_message = "An internal server error occurred. Please try again or contact support."
        error_code = "INTERNAL_SERVER_ERROR"
        http_status = status.HTTP_500_INTERNAL_SERVER_ERROR

    response_payload: Dict[str, Any] = {
        "success": False,
        "message": user_message,
        "error": {
            "code": error_code,
            "type": exc_type,
        },
    }
    if request_id:
        response_payload["request_id"] = request_id

    return JSONResponse(
        status_code=http_status,
        content=response_payload,
    )
