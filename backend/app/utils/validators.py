from fastapi import HTTPException, Request, status


MAX_JSON_PAYLOAD_BYTES = 2 * 1024 * 1024       # 2 MB for JSON body
MAX_UPLOAD_FILE_BYTES = 100 * 1024 * 1024     # 100 MB for Uploads


async def validate_request_content_length(request: Request) -> None:
    """
    Enforces maximum request body size limit and rejects oversized payloads with HTTP 413.
    """
    content_length_str = request.headers.get("content-length")
    if content_length_str:
        try:
            content_length = int(content_length_str)
            path = request.url.path
            max_allowed = (
                MAX_UPLOAD_FILE_BYTES
                if ("/files/upload" in path or "/uploads" in path)
                else MAX_JSON_PAYLOAD_BYTES
            )

            if content_length > max_allowed:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Payload size ({content_length} bytes) exceeds limit of {max_allowed} bytes.",
                )
        except ValueError:
            pass
