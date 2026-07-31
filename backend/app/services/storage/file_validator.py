from fastapi import HTTPException, status
from app.utils.filename import FORBIDDEN_EXTENSIONS, sanitize_filename


def validate_file_upload(
    file_bytes: bytes, original_filename: str, max_size_mb: int = 50
) -> str:
    """
    Validates file size, zero-byte uploads, forbidden extension security checks.
    Returns clean filename.
    """
    # 1. Zero-byte check
    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload failed. File is empty (0 bytes).",
        )

    # 2. Maximum file size check
    max_bytes = max_size_mb * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Upload rejected. File size ({len(file_bytes) / (1024*1024):.2f} MB) exceeds maximum allowed limit of {max_size_mb} MB.",
        )

    # 3. Filename length check
    clean_name = sanitize_filename(original_filename)
    if len(clean_name) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is too long. Maximum allowed length is 255 characters.",
        )

    # 4. Check forbidden extension
    ext = clean_name.split(".")[-1].lower() if "." in clean_name else ""
    if ext in FORBIDDEN_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Forbidden file extension '.{ext}'. Executable files are prohibited.",
        )

    return clean_name
