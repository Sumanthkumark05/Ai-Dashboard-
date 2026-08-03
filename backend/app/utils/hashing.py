import hashlib


def hash_api_key(raw_key: str) -> str:
    """
    Computes SHA-256 hash digest of a raw API key string.
    """
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
