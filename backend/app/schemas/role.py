import uuid
from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict
from app.schemas.permission import PermissionResponse


class RoleResponse(BaseModel):
    """
    Pydantic schema for Role entity response with associated permissions.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str
    is_system: bool
    permissions: List[PermissionResponse] = []
    created_at: datetime
