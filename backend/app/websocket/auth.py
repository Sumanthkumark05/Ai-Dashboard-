import uuid
from typing import Optional
from fastapi import WebSocket, status
from loguru import logger

from app.schemas.websocket import WebSocketAuthData
from app.security.jwt import decode_token


async def authenticate_websocket(
    websocket: WebSocket, token: Optional[str] = None
) -> Optional[WebSocketAuthData]:
    """
    Authenticates a WebSocket connection using JWT passed in query string or headers.
    Returns WebSocketAuthData if valid, or closes connection with 1008 Policy Violation.
    """
    auth_token = token

    # Extract token from query params or headers if not passed directly
    if not auth_token:
        auth_token = websocket.query_params.get("token")

    if not auth_token:
        auth_header = websocket.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            auth_token = auth_header.split(" ")[1]

    if not auth_token:
        logger.warning("WebSocket connection attempt rejected: Missing authentication token.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing authentication token")
        return None

    try:
        payload = decode_token(auth_token)
        sub = payload.get("sub")
        if not sub or payload.get("type") != "access":
            raise ValueError("Invalid token payload")

        try:
            user_id = uuid.UUID(sub)
        except ValueError:
            user_id = uuid.uuid5(uuid.NAMESPACE_DNS, sub)

        email = payload.get("email", f"{sub}@neurodesk.ai")
        username = payload.get("username", sub.split("@")[0])
        roles = payload.get("roles", ["USER"])

        return WebSocketAuthData(
            user_id=user_id,
            email=email,
            username=username,
            roles=roles,
        )
    except Exception as e:
        logger.warning(f"WebSocket connection attempt rejected: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid authentication token")
        return None
