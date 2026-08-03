import time
import uuid
from typing import Callable
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger
from app.core.config import settings


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware that assigns a unique UUID Request ID to every incoming request.
    Appends 'X-Request-ID' to the response header.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        response: Response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs execution time, HTTP method, path, status code, and client IP.
    Appends 'X-Process-Time-MS' to the response header.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.perf_counter()
        request_id = getattr(request.state, "request_id", "N/A")

        response: Response = await call_next(request)

        process_time_ms = (time.perf_counter() - start_time) * 1000
        response.headers["X-Process-Time-MS"] = f"{process_time_ms:.2f}"

        client_host = request.client.host if request.client else "unknown"
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} "
            f"- Status: {response.status_code} - Duration: {process_time_ms:.2f}ms - Client: {client_host}"
        )

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware adding essential production security headers to HTTP responses.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response


from app.middleware.rate_limit import RateLimitMiddleware


def register_middlewares(app: FastAPI) -> None:
    """
    Register all application middlewares in correct order.
    """
    # 1. Rate Limiting & Payload Size Validation
    app.add_middleware(RateLimitMiddleware)

    # 2. Custom Security Headers
    app.add_middleware(SecurityHeadersMiddleware)

    # 3. Request Timing & Logging
    app.add_middleware(RequestLoggingMiddleware)

    # 4. Request ID Tracing
    app.add_middleware(RequestIDMiddleware)

    # 5. GZip Compression for payloads >= 1000 bytes
    app.add_middleware(GZipMiddleware, minimum_size=1000)


    # 5. CORS Configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time-MS"],
    )

