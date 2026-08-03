import secrets
from typing import Tuple
from app.utils.hashing import hash_api_key


def generate_api_key(prefix: str = "nd_live") -> Tuple[str, str, str]:
    """
    Generates a secure random API key.
    Returns tuple: (raw_key, prefix, key_hash)
    Example raw_key: "nd_live_a1b2c3d4e5f6g7h8..."
    """
    random_bytes = secrets.token_urlsafe(32)
    raw_key = f"{prefix}_{random_bytes}"
    key_prefix = raw_key[:12]
    key_hash = hash_api_key(raw_key)
    return raw_key, key_prefix, key_hash
