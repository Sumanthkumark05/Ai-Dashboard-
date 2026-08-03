from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.services.rate_limit_service import rate_limit_service
from app.services.security_service import security_service
from app.utils.validators import validate_request_content_length


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware executing IP blocking, request payload size validation, and Redis sliding-window rate limiting.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        client_ip = request.client.host if request.client else "127.0.0.1"

        # 1. IP Blocking Check
        if security_service.is_ip_blocked(client_ip):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Access denied. IP address blocked due to repeated security violations.",
                    "error": {"code": "IP_BLOCKED"},
                },
            )

        # 2. Payload size validation check
        try:
            await validate_request_content_length(request)
        except Exception as e:
            if hasattr(e, "status_code") and e.status_code == status.HTTP_413_REQUEST_ENTITY_TOO_LARGE:
                return JSONResponse(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    content={
                        "success": False,
                        "message": str(e.detail),
                        "error": {"code": "PAYLOAD_TOO_LARGE"},
                    },
                )

        # 3. Rate limiting check (Exclude docs and OpenAPI)
        path = request.url.path
        if not path.startswith("/docs") and not path.startswith("/redoc") and not path.startswith("/openapi"):
            identifier = client_ip
            auth_header = request.headers.get("authorization")
            if auth_header and auth_header.startswith("Bearer "):
                identifier = auth_header.split(" ")[1][:16]  # Token prefix

            is_limited, retry_after = await rate_limit_service.is_rate_limited(identifier, path)
            if is_limited:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    headers={"Retry-After": str(retry_after)},
                    content={
                        "success": False,
                        "message": f"Rate limit exceeded. Please retry after {retry_after} seconds.",
                        "error": {"code": "RATE_LIMIT_EXCEEDED"},
                    },
                )

        return await call_next(request)
