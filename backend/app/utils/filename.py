import os
import re
import uuid
from fastapi import HTTPException, status

FORBIDDEN_EXTENSIONS = {
    "exe", "bat", "cmd", "sh", "php", "pl", "py", "rb", "js", "vbs",
    "jar", "app", "dmg", "pkg", "deb", "rpm", "msi", "scr", "pif", "com",
}


def sanitize_filename(original_filename: str) -> str:
    """
    Sanitizes filename by removing path traversal characters and non-alphanumeric chars.
    """
    clean_name = os.path.basename(original_filename)
    # Remove NULL bytes or illegal chars
    clean_name = re.sub(r"[^\w\.-]", "_", clean_name)
    return clean_name


def generate_unique_filename(original_filename: str) -> str:
    """
    Generates a secure UUID-based filename preserving the original extension.
    Prevents path traversal, double extensions, and executable uploads.
    """
    clean_name = sanitize_filename(original_filename)
    parts = clean_name.split(".")

    if len(parts) < 2:
        ext = "bin"
    else:
        ext = parts[-1].lower()

    # Check for executable / dangerous extensions
    if ext in FORBIDDEN_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Forbidden file extension '.{ext}'. Executable files are prohibited.",
        )

    # Check for double extensions (e.g., file.php.jpg)
    if len(parts) > 2:
        secondary_ext = parts[-2].lower()
        if secondary_ext in FORBIDDEN_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Suspicious double extension detected (.{secondary_ext}.{ext}). Upload rejected.",
            )

    unique_id = uuid.uuid4().hex[:16]
    return f"{unique_id}.{ext}"
