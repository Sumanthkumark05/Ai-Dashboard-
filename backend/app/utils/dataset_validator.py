import os
from fastapi import HTTPException, status

SUPPORTED_DATASET_EXTENSIONS = {
    "csv",
    "xlsx",
    "json",
    "parquet",
    "sql",
    "txt",
    "pdf",
    "docx",
    "markdown",
    "md",
    "html",
    "xml",
}


def validate_dataset_extension(filename: str) -> str:
    """
    Validates and extracts dataset file extension.
    Raises HTTPException 400 if extension is unsupported.
    """
    ext = os.path.splitext(filename)[1].lstrip(".").lower()
    if ext == "md":
        ext = "markdown"

    if not ext or ext not in SUPPORTED_DATASET_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported dataset extension '.{ext}'. Supported extensions: {sorted(list(SUPPORTED_DATASET_EXTENSIONS))}",
        )
    return ext


def validate_dataset_size(file_size_bytes: int, max_size_mb: int = 100) -> None:
    """
    Validates dataset file size.
    """
    max_bytes = max_size_mb * 1024 * 1024
    if file_size_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset file size ({file_size_bytes / (1024*1024):.2f} MB) exceeds maximum limit of {max_size_mb} MB.",
        )
