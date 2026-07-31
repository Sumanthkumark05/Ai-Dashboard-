import hashlib


def calculate_sha256(content: bytes) -> str:
    """
    Calculates SHA-256 hex digest for file bytes.
    """
    return hashlib.sha256(content).hexdigest()
