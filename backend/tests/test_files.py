from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app


@pytest_asyncio.fixture
async def file_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture with in-memory SQLite database for File & Media testing.
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
async def test_folder_and_file_management_flow(file_client: AsyncClient) -> None:
    """
    Test folder creation, file upload, versioning, share link, download, analytics, and deletion.
    """
    # 1. Register & Setup Workspace
    reg_resp = await file_client.post(
        "/api/v1/auth/register",
        json={"email": "fileuser@neurodesk.ai", "username": "fileuser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await file_client.post(
        "/api/v1/organizations", json={"name": "File Test Org"}, headers=headers
    )
    headers["X-Organization-ID"] = org_resp.json()["id"]

    ws_resp = await file_client.post(
        "/api/v1/workspaces", json={"name": "File Test WS"}, headers=headers
    )
    headers["X-Workspace-ID"] = ws_resp.json()["id"]

    # 2. Create Folder
    folder_resp = await file_client.post(
        "/api/v1/folders", json={"name": "Projects"}, headers=headers
    )
    assert folder_resp.status_code == 201
    folder_id = folder_resp.json()["id"]

    # 3. Single File Upload
    file_payload = ("test_doc.pdf", b"%PDF-1.4 Mock PDF Content payload", "application/pdf")
    upload_resp = await file_client.post(
        f"/api/v1/files/upload?folder_id={folder_id}",
        files={"file": file_payload},
        headers=headers,
    )
    assert upload_resp.status_code == 201
    file_data = upload_resp.json()
    assert file_data["original_name"] == "test_doc.pdf"
    assert file_data["file_type"].lower() == "document"
    file_id = file_data["id"]

    # 4. Executable File Security Check (Must Fail)
    exe_payload = ("malicious.exe", b"MZ executable payload", "application/octet-stream")
    exe_resp = await file_client.post(
        "/api/v1/files/upload",
        files={"file": exe_payload},
        headers=headers,
    )
    assert exe_resp.status_code == 400

    # 5. Upload New Version
    v2_payload = ("test_doc.pdf", b"%PDF-1.4 Mock PDF Content V2 updated", "application/pdf")
    v2_resp = await file_client.post(
        f"/api/v1/files/{file_id}/new-version",
        files={"file": v2_payload},
        headers=headers,
    )
    assert v2_resp.status_code == 200
    assert v2_resp.json()["version"] == 2

    # 6. List Version History
    versions_resp = await file_client.get(
        f"/api/v1/files/{file_id}/versions", headers=headers
    )
    assert versions_resp.status_code == 200
    assert len(versions_resp.json()["items"]) == 2

    # 7. Create Share Link & Download Publicly
    share_resp = await file_client.post(
        f"/api/v1/files/{file_id}/share",
        json={"expires_in_days": 7},
        headers=headers,
    )
    assert share_resp.status_code == 200
    share_token = share_resp.json()["token"]

    public_dl = await file_client.get(f"/api/v1/files/share/{share_token}")
    assert public_dl.status_code == 200
    assert b"%PDF-1.4" in public_dl.content

    # 8. Storage Analytics
    analytics_resp = await file_client.get("/api/v1/files/analytics", headers=headers)
    assert analytics_resp.status_code == 200
    assert analytics_resp.json()["total_files"] == 1

    # 9. Permanent Delete File
    del_resp = await file_client.delete(
        f"/api/v1/files/{file_id}/permanent", headers=headers
    )
    assert del_resp.status_code == 200
