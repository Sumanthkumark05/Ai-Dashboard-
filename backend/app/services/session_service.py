import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Tuple
from loguru import logger

from app.models.user_session import UserSession
from app.repositories.session_repository import SessionRepository


class SessionService:
    """
    Business Logic Service managing user sessions, device tracking, and token persistence.
    """

    @staticmethod
    def parse_user_agent(user_agent: str) -> Tuple[str, str, str]:
        """
        Parses user agent string to extract (device_name, browser, os).
        """
        ua_lower = user_agent.lower()

        # Browser detection
        if "chrome" in ua_lower and "edg" not in ua_lower:
            browser = "Chrome"
        elif "safari" in ua_lower and "chrome" not in ua_lower:
            browser = "Safari"
        elif "firefox" in ua_lower:
            browser = "Firefox"
        elif "edg" in ua_lower:
            browser = "Edge"
        else:
            browser = "Unknown Browser"

        # OS detection
        if "mac" in ua_lower:
            os = "macOS"
        elif "windows" in ua_lower:
            os = "Windows"
        elif "linux" in ua_lower:
            os = "Linux"
        elif "iphone" in ua_lower or "ipad" in ua_lower:
            os = "iOS"
        elif "android" in ua_lower:
            os = "Android"
        else:
            os = "Unknown OS"

        device_name = f"{browser} on {os}"
        return device_name, browser, os

    @staticmethod
    async def create_session(
        user_id: uuid.UUID,
        refresh_token: str,
        user_agent: str,
        ip_address: str,
        repo: SessionRepository,
    ) -> UserSession:
        """
        Persists a new active user device session.
        """
        device_name, browser, os = SessionService.parse_user_agent(user_agent)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        session_item = await repo.create(
            user_id=user_id,
            device_name=device_name,
            browser=browser,
            os=os,
            ip_address=ip_address,
            user_agent=user_agent,
            refresh_token=refresh_token,
            expires_at=expires_at,
            is_active=True,
        )

        logger.info(f"User session created for User ID {user_id} ({device_name})")
        return session_item

    @staticmethod
    async def get_active_sessions(
        user_id: uuid.UUID, repo: SessionRepository
    ) -> List[UserSession]:
        """
        Retrieves all active non-expired user sessions.
        """
        return await repo.get_active_sessions(user_id)

    @staticmethod
    async def terminate_session(
        session_id: uuid.UUID, user_id: uuid.UUID, repo: SessionRepository
    ) -> bool:
        """
        Deactivates a specific user session by ID.
        """
        success = await repo.terminate_session(session_id, user_id)
        if success:
            logger.info(f"Session {session_id} terminated for User ID {user_id}")
        return success

    @staticmethod
    async def terminate_all_sessions(
        user_id: uuid.UUID, repo: SessionRepository
    ) -> int:
        """
        Terminates all active user sessions (Logout all devices).
        """
        count = await repo.terminate_all_sessions(user_id)
        logger.info(f"Terminated {count} active sessions for User ID {user_id}")
        return count
