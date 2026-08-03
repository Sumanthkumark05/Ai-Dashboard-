from typing import Any, Dict
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
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
    "/health/live",
    response_model=Dict[str, Any],
    summary="Kubernetes Liveness Probe",
    description="Liveness probe verifying HTTP application server process is running.",
)
async def liveness_probe() -> Dict[str, Any]:
    return {"status": "live", "service": settings.APP_NAME}


@router.get(
    "/health/ready",
    response_model=Dict[str, Any],
    summary="Kubernetes Readiness Probe",
    description="Readiness probe verifying PostgreSQL database and storage dependencies.",
)
async def readiness_probe() -> JSONResponse:
    db_health = await check_database()
    is_ready = db_health["healthy"]

    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if is_ready else "not_ready",
            "database": db_health["status"],
            "latency_ms": db_health["latency_ms"],
        },
    )


@router.get(
    "/ping",
    response_model=MessageResponse,
    summary="Ping Endpoint",
    description="Simple ping endpoint for load balancer health checks and connectivity tests.",
)
async def ping() -> MessageResponse:
    return MessageResponse(message="pong")
