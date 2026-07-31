import os
from fastapi import HTTPException, status
from app.core.constants import SUPPORTED_FILE_EXTENSIONS


def validate_file_extension(filename: str) -> str:
    """
    Validates and extracts extension from filename.
    Raises HTTPException 400 if extension is unsupported.
    """
    ext = os.path.splitext(filename)[1].lstrip(".").lower()
    if not ext or ext not in SUPPORTED_FILE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '.{ext}'. Supported extensions: {sorted(list(SUPPORTED_FILE_EXTENSIONS))}",
        )
    return ext


def validate_max_file_size(file_size_bytes: int, max_size_mb: int = 50) -> None:
    """
    Validates file size limit.
    """
    max_bytes = max_size_mb * 1024 * 1024
    if file_size_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size ({file_size_bytes / (1024*1024):.2f} MB) exceeds maximum allowed upload size of {max_size_mb} MB.",
        )
