from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    message: str = Field(..., description="Response message payload")


class HealthStatusResponse(BaseModel):
    status: str = Field(default="healthy", description="Current system operational status")
    service: str = Field(default="NeuroDesk AI", description="Service name")
    version: str = Field(default="1.0.0", description="Backend service version")
    environment: str = Field(default="development", description="Current environment")
    database: str = Field(default="connected", description="Database connection status")
    latency: str = Field(default="0.00ms", description="Database connection query latency")
    db_version: str = Field(default="Unknown", description="Database engine version")

