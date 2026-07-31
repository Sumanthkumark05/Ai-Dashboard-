# NeuroDesk AI – Backend Architecture (Modules 1–10)

Production-ready FastAPI backend foundation, centralized configuration system, asynchronous PostgreSQL database infrastructure, JWT Authentication, Enterprise Authorization (RBAC), Multi-Tenant Organization Architecture, Workspace Management, Document Management, Dataset Management, and File Storage & Upload Engine built following Clean Architecture principles for **NeuroDesk AI** enterprise SaaS platform.

---

## 🌟 Overview

- **Module 1 (Backend Foundation)**: Core FastAPI 0.110+ app, Loguru logging, async lifespan, middleware chain, global exception handlers, API versioning (`/api/v1/`).
- **Module 2 (Configuration & Environment Management)**: Centralized Pydantic Settings v2, feature flags, CORS origins.
- **Module 3 (Database Infrastructure)**: SQLAlchemy 2.0 Async ORM, connection pooling, transactions, generic `BaseRepository`, Alembic async migrations.
- **Module 4 (Authentication & User Management)**: User model, bcrypt hashing, JWT access/refresh tokens, registration, authentication endpoints.
- **Module 5 (Authorization, RBAC & Session Management)**: `Role` & `Permission` ORM models, session tracking, device management, user login history.
- **Module 6 (Organizations & Multi-Tenant Architecture)**: Multi-tenant root `Organization` model, members, role assignments, secure invitation tokens.
- **Module 7 (Workspace Management)**: Primary collaborative `Workspace` environment, resource counters, member management, workspace archive/restore.
- **Module 8 (Document Management)**: Workspace document metadata, file validation, storage quota enforcement, favorite toggle, version history, soft deletion & restoration.
- **Module 9 (Dataset Management)**: Workspace dataset metadata, format types (`CSV`, `XLSX`, `JSON`, `PARQUET`, etc.), statistics, version history, tag management.
- **Module 10 (File Storage & Upload Engine)**:
  - **Storage Provider Abstraction (`StorageInterface`)**: Clean architecture storage interface allowing seamless provider switching between `LocalStorage` (Development) and AWS S3 / Supabase / GCS (Production)
  - **Storage Factory (`StorageFactory`)**: Singleton factory reading `settings.STORAGE_PROVIDER`
  - **Security Engine (`app/services/storage/file_validator.py` & `app/utils/filename.py`)**: UUID-based secure filename generation, zero-byte file rejection, max upload size enforcement, path traversal protection, executable extension blocking (`.exe`, `.sh`, `.bat`, `.php`), double extension protection
  - **SHA-256 Checksum Engine (`calculate_sha256`)**: Calculates cryptographic file digests for duplicate upload detection
  - **Thumbnail Service Architecture Stub (`ThumbnailService`)**: Image preview processing foundation
  - **Upload Engine API Routes**:
    - `POST /api/v1/uploads`: Upload file payload via multipart form data into categorized subfolders (`documents`, `datasets`, `avatars`, `workspaces`, `organizations`, `temp`)
    - `GET /api/v1/uploads/{storage_path:path}/metadata`: Get file metadata
    - `GET /api/v1/uploads/{storage_path:path}/download`: Download complete file
    - `GET /api/v1/uploads/{storage_path:path}/stream`: Stream file content in chunks
    - `DELETE /api/v1/uploads/{storage_path:path}`: Delete file from storage provider

---

## 📁 Project Structure

```
backend/
├── alembic/
│   ├── versions/
│   │   ├── 0001_initial_baseline.py
│   │   ├── 0002_create_users_table.py
│   │   ├── 0003_create_rbac_and_sessions.py
│   │   ├── 0004_create_organizations_tables.py
│   │   ├── 0005_create_workspaces_tables.py
│   │   ├── 0006_create_documents_tables.py
│   │   └── 0007_create_datasets_tables.py
│   ├── env.py
│   └── script.py.mako
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── routes/
│   │       │   ├── auth.py
│   │       │   ├── datasets.py
│   │       │   ├── documents.py
│   │       │   ├── health.py
│   │       │   ├── invitations.py
│   │       │   ├── organizations.py
│   │       │   ├── permissions.py
│   │       │   ├── roles.py
│   │       │   ├── sessions.py
│   │       │   ├── uploads.py         # File Storage & Upload Engine Routes
│   │       │   ├── users.py
│   │       │   └── workspaces.py
│   │       └── __init__.py
│   ├── core/
│   │   ├── config.py
│   │   ├── constants.py
│   │   ├── environments.py
│   │   ├── exceptions.py
│   │   ├── lifespan.py
│   │   ├── logging.py
│   │   └── middleware.py
│   ├── database/
│   │   ├── base.py
│   │   ├── dependency.py
│   │   ├── engine.py
│   │   ├── health.py
│   │   ├── session.py
│   │   └── transaction.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── dataset.py
│   │   ├── dataset_tag.py
│   │   ├── dataset_version.py
│   │   ├── document.py
│   │   ├── document_tag.py
│   │   ├── document_version.py
│   │   ├── invitation.py
│   │   ├── login_history.py
│   │   ├── organization.py
│   │   ├── organization_member.py
│   │   ├── permission.py
│   │   ├── refresh_token.py
│   │   ├── role.py
│   │   ├── user.py
│   │   ├── user_session.py
│   │   ├── workspace.py
│   │   └── workspace_member.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base_repository.py
│   │   ├── dataset_repository.py
│   │   ├── document_repository.py
│   │   ├── invitation_repository.py
│   │   ├── login_history_repository.py
│   │   ├── organization_member_repository.py
│   │   ├── organization_repository.py
│   │   ├── permission_repository.py
│   │   ├── refresh_token_repository.py
│   │   ├── role_repository.py
│   │   ├── session_repository.py
│   │   ├── user_repository.py
│   │   ├── workspace_member_repository.py
│   │   └── workspace_repository.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── dataset.py
│   │   ├── document.py
│   │   ├── health.py
│   │   ├── invitation.py
│   │   ├── organization.py
│   │   ├── organization_member.py
│   │   ├── permission.py
│   │   ├── role.py
│   │   ├── session.py
│   │   ├── token.py
│   │   ├── upload.py                  # File Upload Schemas
│   │   ├── user.py
│   │   ├── workspace.py
│   │   └── workspace_member.py
│   ├── security/
│   │   ├── __init__.py
│   │   ├── decorators.py
│   │   ├── dependencies.py
│   │   ├── jwt.py
│   │   ├── organization_dependency.py
│   │   ├── password.py
│   │   ├── permissions.py
│   │   └── workspace_dependency.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── authorization_service.py
│   │   ├── dataset_service.py
│   │   ├── dataset_statistics_service.py
│   │   ├── dataset_validation_service.py
│   │   ├── document_service.py
│   │   ├── document_validation_service.py
│   │   ├── invitation_service.py
│   │   ├── membership_service.py
│   │   ├── organization_service.py
│   │   ├── permission_service.py
│   │   ├── session_service.py
│   │   ├── storage/
│   │   │   ├── checksum.py            # SHA-256 Checksum Helper
│   │   │   ├── file_validator.py       # File Upload Security Validator
│   │   │   ├── local_storage.py        # Local Storage Provider Implementation
│   │   │   ├── storage_factory.py      # Storage Provider Factory
│   │   │   ├── storage_interface.py    # Abstract Storage Provider Interface
│   │   │   ├── storage_service.py      # High-Level Storage Service
│   │   │   └── thumbnail_service.py    # Thumbnail Service Architecture Stub
│   │   ├── token_service.py
│   │   ├── user_service.py
│   │   ├── workspace_member_service.py
│   │   └── workspace_service.py
│   ├── utils/
│   │   ├── dataset_validator.py
│   │   ├── file_validation.py
│   │   ├── filename.py                # Secure Filename Generator
│   │   └── mime.py                    # MIME Type Mapper
│   └── main.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_config.py
│   ├── test_database.py
│   ├── test_datasets.py
│   ├── test_documents.py
│   ├── test_health.py
│   ├── test_organizations.py
│   ├── test_rbac.py
│   ├── test_uploads.py               # Upload & Storage Engine Unit Tests
│   ├── test_users.py
│   └── test_workspaces.py
├── .env.example
├── .env.development
├── .env.testing
├── .env.production
├── .env
├── alembic.ini
├── pytest.ini
├── requirements.txt
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Create Python Virtual Environment & Install Dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure PostgreSQL Database & Run Migrations

```bash
# Apply Alembic Migrations
alembic upgrade head
```

---

## 🚀 Running the Server

Start the FastAPI development server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Access Interactive Documentation & Swagger OAuth2 Login:
- **Swagger Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Interactive Docs**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Running Automated Unit Tests

Execute all 41 automated unit tests across Modules 1–10:

```bash
pytest
```









