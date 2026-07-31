import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.user import User
from app.repositories.login_history_repository import LoginHistoryRepository
from app.repositories.session_repository import SessionRepository
from app.schemas.session import LoginHistoryResponse, SessionResponse
from app.security.dependencies import get_current_user
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["Session & Device Management"])


@router.get(
    "",
    response_model=List[SessionResponse],
    summary="List Active User Sessions",
    description="Returns all active device sessions for the authenticated user.",
)
async def list_active_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[SessionResponse]:
    repo = SessionRepository(db)
    sessions = await SessionService.get_active_sessions(current_user.id, repo)
    return [SessionResponse.model_validate(s) for s in sessions]


@router.delete(
    "/{session_id}",
    response_model=Dict[str, Any],
    summary="Terminate Single Device Session",
    description="Terminates a specific active session by ID.",
)
async def terminate_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    repo = SessionRepository(db)
    success = await SessionService.terminate_session(session_id, current_user.id, repo)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or already terminated.",
        )
    return {
        "success": True,
        "message": "Session terminated successfully.",
    }


@router.delete(
    "",
    response_model=Dict[str, Any],
    summary="Logout All Devices",
    description="Terminates all active sessions for the current user.",
)
async def logout_all_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    repo = SessionRepository(db)
    count = await SessionService.terminate_all_sessions(current_user.id, repo)
    return {
        "success": True,
        "message": f"Successfully terminated {count} active sessions across all devices.",
    }


@router.get(
    "/history",
    response_model=Dict[str, Any],
    summary="Get Login Audit History",
    description="Returns paginated login history audit log entries for current user.",
)
async def get_login_history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    repo = LoginHistoryRepository(db)
    data = await repo.get_user_history(current_user.id, page=page, page_size=page_size)
    items_validated = [LoginHistoryResponse.model_validate(item) for item in data["items"]]

    return {
        "items": items_validated,
        "total_items": data["total_items"],
        "page": data["page"],
        "page_size": data["page_size"],
    }
