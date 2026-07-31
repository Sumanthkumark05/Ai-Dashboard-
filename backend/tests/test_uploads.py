from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app


@pytest_asyncio.fixture
async def upload_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture with in-memory SQLite database for Upload testing.
    """
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    testing_session_factory = async_sessionmaker(
        bind=test_engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
    )

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with testing_session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.asyncio
async def test_file_upload_download_stream_and_delete(upload_client: AsyncClient) -> None:
    """
    Test uploading a file, downloading, streaming, getting metadata, and deleting.
    """
    # 1. Register & Login User
    reg_resp = await upload_client.post(
        "/api/v1/auth/register",
        json={"email": "storageuser@neurodesk.ai", "username": "storageuser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload file payload
    file_content = b"NeuroDesk AI test file content for storage engine verification."
    files = {"file": ("test_doc.txt", file_content, "text/plain")}
    data = {"subfolder": "documents"}

    upload_resp = await upload_client.post(
        "/api/v1/uploads", files=files, data=data, headers=headers
    )
    assert upload_resp.status_code == 201
    meta = upload_resp.json()
    assert meta["original_filename"] == "test_doc.txt"
    assert meta["size"] == len(file_content)
    storage_path = meta["storage_path"]

    # 3. Get Metadata
    meta_resp = await upload_client.get(
        f"/api/v1/uploads/{storage_path}/metadata", headers=headers
    )
    assert meta_resp.status_code == 200
    assert meta_resp.json()["size"] == len(file_content)

    # 4. Download file
    down_resp = await upload_client.get(
        f"/api/v1/uploads/{storage_path}/download", headers=headers
    )
    assert down_resp.status_code == 200
    assert down_resp.content == file_content

    # 5. Stream file
    stream_resp = await upload_client.get(
        f"/api/v1/uploads/{storage_path}/stream", headers=headers
    )
    assert stream_resp.status_code == 200
    assert stream_resp.content == file_content

    # 6. Delete file
    del_resp = await upload_client.delete(
        f"/api/v1/uploads/{storage_path}", headers=headers
    )
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True


@pytest.mark.asyncio
async def test_executable_upload_rejected(upload_client: AsyncClient) -> None:
    """
    Test that executable extensions (e.g. .exe, .sh) are rejected with HTTP 400.
    """
    reg_resp = await upload_client.post(
        "/api/v1/auth/register",
        json={"email": "hacker@neurodesk.ai", "username": "hacker", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    files = {"file": ("malicious.sh", b"#!/bin/bash\necho 'hack'", "application/x-sh")}
    upload_resp = await upload_client.post(
        "/api/v1/uploads", files=files, headers=headers
    )
    assert upload_resp.status_code == 400


@pytest.mark.asyncio
async def test_path_traversal_blocked(upload_client: AsyncClient) -> None:
    """
    Test that path traversal attempts (e.g. ../../etc/passwd) are blocked.
    """
    resp = await upload_client.get("/api/v1/uploads/../../etc/passwd/metadata")
    assert resp.status_code in (400, 404)
