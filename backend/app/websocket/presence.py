import uuid
from datetime import datetime, timezone
from typing import Dict, Set


class PresenceTracker:
    """
    In-memory presence tracking online/offline states and last active timestamps.
    """

    def __init__(self) -> None:
        self.online_users: Set[uuid.UUID] = set()
        self.last_seen: Dict[uuid.UUID, datetime] = {}

    def mark_online(self, user_id: uuid.UUID) -> bool:
        """
        Marks user online. Returns True if status changed from offline to online.
        """
        was_offline = user_id not in self.online_users
        self.online_users.add(user_id)
        self.last_seen[user_id] = datetime.now(timezone.utc)
        return was_offline

    def mark_offline(self, user_id: uuid.UUID) -> bool:
        """
        Marks user offline. Returns True if status changed from online to offline.
        """
        if user_id in self.online_users:
            self.online_users.remove(user_id)
            self.last_seen[user_id] = datetime.now(timezone.utc)
            return True
        return False

    def is_online(self, user_id: uuid.UUID) -> bool:
        return user_id in self.online_users

    def get_last_seen(self, user_id: uuid.UUID) -> str:
        dt = self.last_seen.get(user_id)
        return dt.isoformat() if dt else datetime.now(timezone.utc).isoformat()


presence_tracker = PresenceTracker()
