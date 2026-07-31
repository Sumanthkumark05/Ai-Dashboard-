import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PermissionResponse(BaseModel):
    """
    Pydantic schema for Permission entity response.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str
    resource: str
    action: str
    created_at: datetime
