import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.login_history import LoginHistory
from app.models.user import User
from app.repositories.base_repository import BaseRepository
from app.schemas.login_history import LoginHistoryListResponse, LoginHistoryResponse
from app.security.dependencies import get_current_user
from app.services.login_history_service import LoginHistoryService

router = APIRouter(prefix="/login-history", tags=["Login History"])


@router.get(
    "",
    response_model=LoginHistoryListResponse,
    summary="List Current User Login History",
    description="Returns paginated login history records for the current authenticated user.",
)
async def list_login_history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LoginHistoryListResponse:
    data = await LoginHistoryService.get_user_login_history(
        user_id=current_user.id,
        db=db,
        page=page,
        page_size=page_size,
    )
    items = [LoginHistoryResponse.model_validate(h) for h in data["items"]]
    return LoginHistoryListResponse(
        items=items,
        total_items=data["total_items"],
        page=data["page"],
        page_size=data["page_size"],
    )


@router.get(
    "/{history_id}",
    response_model=LoginHistoryResponse,
    summary="Get Login History Details",
    description="Returns details for a specific login history record.",
)
async def get_login_history_item(
    history_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LoginHistoryResponse:
    repo = BaseRepository(LoginHistory, db)
    item = await repo.get_by_id(history_id)
    if not item or item.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Login history record not found.",
        )
    return LoginHistoryResponse.model_validate(item)
