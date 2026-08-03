import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.api_key import (
    ApiKeyResponse,
    CreateApiKeyRequest,
    CreateApiKeyResponse,
    UpdateApiKeyRequest,
)
from app.security.dependencies import get_current_user
from app.security.workspace_dependency import get_current_workspace
from app.services.api_key_service import ApiKeyService

router = APIRouter(prefix="/api-keys", tags=["API Keys Management"])


@router.post(
    "",
    response_model=CreateApiKeyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create API Key",
    description="Generates a new API Key for workspace programmatic access. The unhashed raw_key secret is returned only once.",
)
async def create_api_key(
    payload: CreateApiKeyRequest,
    current_ws: Workspace = Depends(get_current_workspace),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CreateApiKeyResponse:
    api_key, raw_key = await ApiKeyService.create_api_key(current_ws.id, current_user, payload, db)
    return CreateApiKeyResponse(
        api_key=ApiKeyResponse.model_validate(api_key),
        raw_key=raw_key,
    )


@router.get(
    "",
    response_model=List[ApiKeyResponse],
    summary="List Workspace API Keys",
    description="Returns all API keys created in the current workspace.",
)
async def list_api_keys(
    current_ws: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
) -> List[ApiKeyResponse]:
    keys = await ApiKeyService.get_workspace_api_keys(current_ws.id, db)
    return [ApiKeyResponse.model_validate(k) for k in keys]


@router.post(
    "/{key_id}/rotate",
    response_model=CreateApiKeyResponse,
    summary="Rotate API Key",
    description="Revokes current key secret and generates a new secret key for the same record.",
)
async def rotate_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CreateApiKeyResponse:
    api_key, raw_key = await ApiKeyService.rotate_api_key(key_id, current_user.id, db)
    return CreateApiKeyResponse(
        api_key=ApiKeyResponse.model_validate(api_key),
        raw_key=raw_key,
    )


@router.delete(
    "/{key_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete / Revoke API Key",
    description="Revokes and deletes an API key.",
)
async def delete_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await ApiKeyService.delete_api_key(key_id, current_user.id, db)
    return {
        "success": True,
        "message": f"API Key '{key_id}' deleted successfully.",
    }
