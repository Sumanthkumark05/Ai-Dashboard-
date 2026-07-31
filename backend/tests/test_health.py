import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient) -> None:
    """
    Test GET / root endpoint returns 200 OK and welcome message.
    """
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Welcome to NeuroDesk AI Backend"
    assert "X-Request-ID" in response.headers
    assert "X-Process-Time-MS" in response.headers


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient) -> None:
    """
    Test GET /api/v1/health endpoint returns operational status and DB health diagnostics.
    """
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert data["service"] == "NeuroDesk AI"
    assert data["version"] == "1.0.0"
    assert "database" in data
    assert "latency" in data
    assert "db_version" in data



@pytest.mark.asyncio
async def test_ping_endpoint(client: AsyncClient) -> None:
    """
    Test GET /api/v1/ping endpoint returns pong response.
    """
    response = await client.get("/api/v1/ping")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "pong"


@pytest.mark.asyncio
async def test_not_found_exception_handler(client: AsyncClient) -> None:
    """
    Test GET for non-existent route returns 404 with custom JSON exception schema.
    """
    response = await client.get("/api/v1/unknown-route-12345")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["message"] == "Not Found"
    assert "request_id" in data
