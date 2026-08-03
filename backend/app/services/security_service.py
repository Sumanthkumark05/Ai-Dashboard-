from typing import Dict, List, Set
from loguru import logger


class SecurityService:
    """
    Security Event Detection & IP Blocking Service.
    """

    def __init__(self) -> None:
        self.blocked_ips: Set[str] = set()
        self.whitelisted_ips: Set[str] = {"127.0.0.1", "::1", "localhost"}
        self.failed_auth_attempts: Dict[str, int] = {}
        self.security_events: List[Dict[str, str]] = []

    def is_ip_blocked(self, ip_address: str) -> bool:
        """
        Returns True if IP is explicitly blocked.
        """
        if ip_address in self.whitelisted_ips:
            return False
        return ip_address in self.blocked_ips

    def block_ip(self, ip_address: str, reason: str = "Repeated abuse") -> None:
        """
        Blocks IP address.
        """
        if ip_address not in self.whitelisted_ips:
            self.blocked_ips.add(ip_address)
            logger.warning(f"IP address '{ip_address}' blocked due to: {reason}")
            self.log_security_event("IP_BLOCKED", f"IP {ip_address} blocked: {reason}")

    def record_failed_login(self, ip_address: str) -> None:
        """
        Tracks failed login attempt and blocks IP after 5 consecutive failures.
        """
        count = self.failed_auth_attempts.get(ip_address, 0) + 1
        self.failed_auth_attempts[ip_address] = count

        if count >= 5:
            self.block_ip(ip_address, reason="Excessive failed login attempts (Brute force protection)")

    def reset_failed_login(self, ip_address: str) -> None:
        """
        Resets failed attempt counter on successful login.
        """
        self.failed_auth_attempts.pop(ip_address, None)

    def log_security_event(self, event_type: str, details: str) -> None:
        """
        Logs security event.
        """
        self.security_events.append({"event_type": event_type, "details": details})


security_service = SecurityService()
