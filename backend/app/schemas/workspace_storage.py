import uuid
from typing import Optional
from pydantic import BaseModel


class WorkspaceStorageResponse(BaseModel):
    workspaceId: uuid.UUID
    totalFiles: int
    usedBytes: int
    usedKB: float
    usedMB: float
    capacityMB: float
    remainingMB: float
    percentageUsed: float
    usedFormatted: Optional[str] = None
    remainingFormatted: Optional[str] = None
    capacityFormatted: Optional[str] = None
