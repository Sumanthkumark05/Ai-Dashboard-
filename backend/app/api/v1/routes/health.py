from fastapi import APIRouter
from app.core.config import settings
from app.database.health import check_database
from app.schemas.health import HealthStatusResponse, MessageResponse

router = APIRouter(tags=["Health & System Diagnostics"])


@router.get(
    "/health",
    response_model=HealthStatusResponse,
    summary="Get System & Database Health Status",
    description="Returns operational status, database connectivity, latency, version, and environment.",
)
async def get_health() -> HealthStatusResponse:
    db_health = await check_database()
    overall_status = "healthy" if db_health["healthy"] else "degraded"

    return HealthStatusResponse(
        status=overall_status,
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        database=db_health["status"],
        latency=f"{db_health['latency_ms']:.2f}ms",
        db_version=db_health["version"],
    )



@router.get(
    "/ping",
    response_model=MessageResponse,
    summary="Ping Endpoint",
    description="Simple ping endpoint for load balancer health checks and connectivity tests.",
)
async def ping() -> MessageResponse:
    return MessageResponse(message="pong")
