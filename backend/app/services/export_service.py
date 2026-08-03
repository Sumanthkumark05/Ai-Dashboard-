import csv
import io
import json
from typing import Any, Dict, List
from app.models.audit_log import AuditLog


class ExportService:
    """
    Service converting Audit Logs and Activity datasets into downloadable CSV or JSON formats.
    """

    @staticmethod
    def export_audit_logs_csv(logs: List[AuditLog]) -> str:
        """
        Converts list of AuditLog models to CSV format string.
        """
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            "ID",
            "Timestamp",
            "User ID",
            "Workspace ID",
            "Action",
            "Entity Type",
            "Entity ID",
            "Status",
            "IP Address",
            "Description",
        ])

        for log in logs:
            writer.writerow([
                str(log.id),
                log.created_at.isoformat() if log.created_at else "",
                str(log.user_id) if log.user_id else "",
                str(log.workspace_id) if log.workspace_id else "",
                log.action,
                log.entity_type or "",
                log.entity_id or "",
                log.status,
                log.ip_address or "",
                log.description or "",
            ])

        return output.getvalue()

    @staticmethod
    def export_audit_logs_json(logs: List[AuditLog]) -> str:
        """
        Converts list of AuditLog models to JSON string format.
        """
        items = []
        for log in logs:
            items.append({
                "id": str(log.id),
                "timestamp": log.created_at.isoformat() if log.created_at else "",
                "user_id": str(log.user_id) if log.user_id else None,
                "workspace_id": str(log.workspace_id) if log.workspace_id else None,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "old_value": log.old_value,
                "new_value": log.new_value,
                "status": log.status,
                "ip_address": log.ip_address,
                "description": log.description,
            })
        return json.dumps(items, indent=2)
