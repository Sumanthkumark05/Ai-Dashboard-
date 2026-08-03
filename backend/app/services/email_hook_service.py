from loguru import logger


class EmailHookService:
    """
    Service hooks for sending team-related emails (Invitations, Role Changes, Ownership Transfer).
    No SMTP configuration required; logs triggers for email dispatch system.
    """

    @staticmethod
    async def send_team_invitation(
        email: str, team_name: str, token: str, role: str
    ) -> None:
        logger.info(f"EMAIL HOOK | Invitation sent to '{email}' for Team '{team_name}' (Role: {role}, Token: {token})")

    @staticmethod
    async def send_invitation_accepted(
        email: str, team_name: str
    ) -> None:
        logger.info(f"EMAIL HOOK | Invitation accepted notification sent to team owners of '{team_name}' for user '{email}'")

    @staticmethod
    async def send_member_removed(
        email: str, team_name: str
    ) -> None:
        logger.info(f"EMAIL HOOK | Member removal notification sent to '{email}' for Team '{team_name}'")

    @staticmethod
    async def send_owner_transfer(
        old_owner_email: str, new_owner_email: str, team_name: str
    ) -> None:
        logger.info(f"EMAIL HOOK | Ownership transfer notification sent for Team '{team_name}' from '{old_owner_email}' to '{new_owner_email}'")
