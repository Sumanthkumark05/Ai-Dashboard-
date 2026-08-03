from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.database.base import Base
from app.database.dependency import get_db
from app.main import app


@pytest_asyncio.fixture
async def doc_client() -> AsyncGenerator[AsyncClient, None]:
    """
    HTTPX AsyncClient fixture with in-memory SQLite database for Document testing.
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
async def test_upload_and_list_documents(doc_client: AsyncClient) -> None:
    """
    Test uploading document metadata and listing workspace documents.
    """
    # 1. Register & Setup Org & Workspace
    reg_resp = await doc_client.post(
        "/api/v1/auth/register",
        json={"email": "docuser@neurodesk.ai", "username": "docuser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await doc_client.post(
        "/api/v1/organizations", json={"name": "Doc Org"}, headers=headers
    )
    org_id = org_resp.json()["id"]
    headers["X-Organization-ID"] = org_id

    ws_resp = await doc_client.post(
        "/api/v1/workspaces", json={"name": "Doc WS"}, headers=headers
    )
    ws_id = ws_resp.json()["id"]
    headers["X-Workspace-ID"] = ws_id

    # 2. Upload Document Metadata
    upload_payload = {
        "title": "Quarterly Financial Report",
        "file_name": "report_q3.pdf",
        "mime_type": "application/pdf",
        "file_size": 2048576,
        "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "description": "Financial results for Q3 2026",
        "category": "Finance",
    }
    upload_resp = await doc_client.post(
        "/api/v1/documents", json=upload_payload, headers=headers
    )
    assert upload_resp.status_code == 201
    doc_data = upload_resp.json()
    assert doc_data["title"] == "Quarterly Financial Report"
    assert doc_data["file_extension"] == "pdf"

    # 3. List Documents
    list_resp = await doc_client.get("/api/v1/documents", headers=headers)
    assert list_resp.status_code == 200
    res = list_resp.json()
    assert res["total_items"] == 1
    assert res["items"][0]["title"] == "Quarterly Financial Report"


@pytest.mark.asyncio
async def test_unsupported_file_extension_rejected(doc_client: AsyncClient) -> None:
    """
    Test that unsupported extensions (e.g. .exe) are rejected with HTTP 400.
    """
    reg_resp = await doc_client.post(
        "/api/v1/auth/register",
        json={"email": "badfile@neurodesk.ai", "username": "badfile", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await doc_client.post(
        "/api/v1/organizations", json={"name": "Bad File Org"}, headers=headers
    )
    headers["X-Organization-ID"] = org_resp.json()["id"]

    ws_resp = await doc_client.post(
        "/api/v1/workspaces", json={"name": "Bad File WS"}, headers=headers
    )
    headers["X-Workspace-ID"] = ws_resp.json()["id"]

    bad_payload = {
        "title": "Malicious Executable",
        "file_name": "virus.exe",
        "mime_type": "application/x-msdownload",
        "file_size": 1024,
        "checksum": "abcdef1234567890",
    }
    upload_resp = await doc_client.post(
        "/api/v1/documents", json=bad_payload, headers=headers
    )
    assert upload_resp.status_code == 400


@pytest.mark.asyncio
async def test_document_favorite_and_versions(doc_client: AsyncClient) -> None:
    """
    Test toggling favorite status and fetching version history.
    """
    reg_resp = await doc_client.post(
        "/api/v1/auth/register",
        json={"email": "favuser@neurodesk.ai", "username": "favuser", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await doc_client.post(
        "/api/v1/organizations", json={"name": "Fav Org"}, headers=headers
    )
    headers["X-Organization-ID"] = org_resp.json()["id"]

    ws_resp = await doc_client.post(
        "/api/v1/workspaces", json={"name": "Fav WS"}, headers=headers
    )
    headers["X-Workspace-ID"] = ws_resp.json()["id"]

    upload_payload = {
        "title": "Architecture Specification",
        "file_name": "architecture.md",
        "mime_type": "text/markdown",
        "file_size": 5120,
        "checksum": "1234567890abcdef1234567890abcdef",
    }
    doc_resp = await doc_client.post(
        "/api/v1/documents", json=upload_payload, headers=headers
    )
    doc_id = doc_resp.json()["id"]

    # Toggle Favorite
    fav_resp = await doc_client.post(
        f"/api/v1/documents/{doc_id}/favorite", headers=headers
    )
    assert fav_resp.status_code == 200
    assert fav_resp.json()["is_favorite"] is True

    # List Versions
    vers_resp = await doc_client.get(
        f"/api/v1/documents/{doc_id}/versions", headers=headers
    )
    assert vers_resp.status_code == 200
    versions = vers_resp.json()
    assert len(versions) == 1
    assert versions[0]["version_number"] == 1


@pytest.mark.asyncio
async def test_multipart_document_file_upload_and_download(doc_client: AsyncClient) -> None:
    """
    Test multipart document file upload and download endpoints.
    """
    reg_resp = await doc_client.post(
        "/api/v1/auth/register",
        json={"email": "docupload@neurodesk.ai", "username": "docupload", "password": "Password123!"},
    )
    token = reg_resp.json()["data"]["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    org_resp = await doc_client.post(
        "/api/v1/organizations", json={"name": "Upload Doc Org"}, headers=headers
    )
    headers["X-Organization-ID"] = org_resp.json()["id"]

    ws_resp = await doc_client.post(
        "/api/v1/workspaces", json={"name": "Upload Doc WS"}, headers=headers
    )
    headers["X-Workspace-ID"] = ws_resp.json()["id"]

    # Upload PDF Document file
    file_content = b"%PDF-1.4 %Knowledge Repository Sample Technical Document..."
    file_payload = ("technical_specs.pdf", file_content, "application/pdf")
    
    up_resp = await doc_client.post(
        "/api/v1/documents/upload",
        files={"file": file_payload},
        data={"title": "Technical Specification PDF", "category": "Technical"},
        headers=headers,
    )
    assert up_resp.status_code == 201
    doc_data = up_resp.json()
    assert doc_data["title"] == "Technical Specification PDF"
    assert doc_data["file_extension"] == "pdf"
    assert doc_data["status"] == "ready"
    assert doc_data["processing_status"] == "completed"
    doc_id = doc_data["id"]

    # Download Document File
    dl_resp = await doc_client.get(f"/api/v1/documents/{doc_id}/download", headers=headers)
    assert dl_resp.status_code == 200
    assert dl_resp.content == file_content

