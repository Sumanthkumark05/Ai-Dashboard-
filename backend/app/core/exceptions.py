from typing import Any, Dict
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from loguru import logger


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    Centralized handler for HTTP exceptions (e.g. 404, 403, 401).
    """
    request_id = getattr(request.state, "request_id", None)
    logger.warning(f"HTTP {exc.status_code} on {request.method} {request.url.path}: {exc.detail}")

    response_payload: Dict[str, Any] = {
        "success": False,
        "message": exc.detail if isinstance(exc.detail, str) else "HTTP Exception occurred",
        "error": exc.detail,
    }
    if request_id:
        response_payload["request_id"] = request_id

    return JSONResponse(
        status_code=exc.status_code,
        content=response_payload,
        headers=getattr(exc, "headers", None),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Centralized handler for Pydantic / FastAPI request validation errors (422 Unprocessable Entity).
    """
    request_id = getattr(request.state, "request_id", None)
    logger.warning(f"Validation error on {request.method} {request.url.path}: {exc.errors()}")

    response_payload: Dict[str, Any] = {
        "success": False,
        "message": "Invalid request payload or query parameters",
        "error": exc.errors(),
    }
    if request_id:
        response_payload["request_id"] = request_id

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response_payload,
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Catch-all exception handler for unhandled internal server errors (500).
    """
    request_id = getattr(request.state, "request_id", None)
    logger.exception(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}")

    response_payload: Dict[str, Any] = {
        "success": False,
        "message": "An unexpected internal server error occurred",
        "error": str(exc) if getattr(request.app.state, "debug", False) else "Internal Server Error",
    }
    if request_id:
        response_payload["request_id"] = request_id

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=response_payload,
    )

