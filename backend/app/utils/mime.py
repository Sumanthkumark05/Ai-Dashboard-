import mimetypes

MIME_TYPE_MAP = {
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
    "csv": "text/csv",
    "xls": "application/vnd.ms-excel",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "ppt": "application/vnd.ms-powerpoint",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "json": "application/json",
    "md": "text/markdown",
    "markdown": "text/markdown",
    "html": "text/html",
    "xml": "application/xml",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
    "svg": "image/svg+xml",
    "parquet": "application/x-parquet",
    "sql": "application/sql",
}



def get_mime_type(filename: str) -> str:
    """
    Determines MIME type from filename extension or mimetypes module.
    """
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext in MIME_TYPE_MAP:
        return MIME_TYPE_MAP[ext]

    guessed, _ = mimetypes.guess_type(filename)
    return guessed or "application/octet-stream"
