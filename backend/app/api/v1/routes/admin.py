import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.dependency import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.schemas.admin import (
    AdminDashboardMetrics,
    AdminUserItem,
    AdminUserListResponse,
    AdminWorkspaceItem,
    AdminWorkspaceListResponse,
    BroadcastNotificationRequest,
)
from app.schemas.feature_flag import (
    CreateFeatureFlagRequest,
    FeatureFlagResponse,
    UpdateFeatureFlagRequest,
)
from app.schemas.maintenance import EnableMaintenanceRequest, MaintenanceModeResponse
from app.schemas.system_setting import SystemSettingRequest, SystemSettingResponse
from app.security.admin_dependency import require_admin
from app.services.admin_service import AdminService
from app.services.feature_flag_service import FeatureFlagService
from app.services.maintenance_service import MaintenanceService
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/admin", tags=["Admin Panel APIs"])


@router.get(
    "/dashboard",
    response_model=AdminDashboardMetrics,
    summary="Get Enterprise Admin Dashboard Overview",
    description="Returns high-level system usage metrics, active users, storage utilization, and job statistics.",
)
async def get_admin_dashboard(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminDashboardMetrics:
    return await AdminService.get_dashboard_metrics(db)


@router.get(
    "/users",
    response_model=AdminUserListResponse,
    summary="List & Search System Users",
    description="Returns paginated and searchable user accounts across the entire platform.",
)
async def list_admin_users(
    search: Optional[str] = Query(default=None, description="Search email or username"),
    is_active: Optional[bool] = Query(default=None, description="Filter active/suspended users"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserListResponse:
    data = await AdminService.search_users(
        db=db, search=search, is_active=is_active, page=page, page_size=page_size
    )
    items = [AdminUserItem.model_validate(u) for u in data["items"]]
    return AdminUserListResponse(
        items=items, total_items=data["total_items"], page=data["page"], page_size=data["page_size"]
    )


@router.get(
    "/users/{user_id}",
    response_model=AdminUserItem,
    summary="Get User Account Details",
    description="Returns detailed account status for a specific user ID.",
)
async def get_admin_user(
    user_id: uuid.UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserItem:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )
    return AdminUserItem.model_validate(user)


@router.post(
    "/users/{user_id}/suspend",
    response_model=AdminUserItem,
    summary="Suspend User Account",
    description="Suspends user account, revoking access to system APIs.",
)
async def suspend_user(
    user_id: uuid.UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserItem:
    user = await AdminService.suspend_user(user_id=user_id, admin_id=admin_user.id, db=db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )
    return AdminUserItem.model_validate(user)


@router.post(
    "/users/{user_id}/activate",
    response_model=AdminUserItem,
    summary="Activate Suspended User",
    description="Restores active status to a suspended user account.",
)
async def activate_user(
    user_id: uuid.UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserItem:
    user = await AdminService.activate_user(user_id=user_id, admin_id=admin_user.id, db=db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )
    return AdminUserItem.model_validate(user)


@router.post(
    "/users/{user_id}/force-logout",
    summary="Force Logout User Sessions",
    description="Revokes all active JWT sessions and disconnects WebSockets for the target user.",
)
async def force_logout_user(
    user_id: uuid.UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    success = await AdminService.force_logout_user(user_id=user_id, admin_id=admin_user.id, db=db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )
    return {"message": f"User {user_id} sessions revoked successfully."}


@router.get(
    "/workspaces",
    response_model=AdminWorkspaceListResponse,
    summary="List System Workspaces",
    description="Returns paginated workspaces across all organizations.",
)
async def list_admin_workspaces(
    search: Optional[str] = Query(default=None, description="Search workspace name or slug"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminWorkspaceListResponse:
    data = await AdminService.search_workspaces(
        db=db, search=search, page=page, page_size=page_size
    )
    items = [AdminWorkspaceItem.model_validate(w) for w in data["items"]]
    return AdminWorkspaceListResponse(
        items=items, total_items=data["total_items"], page=data["page"], page_size=data["page_size"]
    )


@router.get(
    "/workspaces/{workspace_id}",
    response_model=AdminWorkspaceItem,
    summary="Get Admin Workspace Details",
    description="Returns detailed metadata for a specific workspace ID.",
)
async def get_admin_workspace(
    workspace_id: uuid.UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminWorkspaceItem:
    ws = await db.get(Workspace, workspace_id)
    if not ws:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found.",
        )
    return AdminWorkspaceItem.model_validate(ws)


@router.get(
    "/feature-flags",
    response_model=List[FeatureFlagResponse],
    summary="List Feature Flags",
    description="Returns all dynamic feature flags and rollout percentages.",
)
async def list_feature_flags(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> List[FeatureFlagResponse]:
    flags = await FeatureFlagService.list_flags(db)
    return [FeatureFlagResponse.model_validate(f) for f in flags]


@router.post(
    "/feature-flags",
    response_model=FeatureFlagResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Feature Flag",
    description="Creates a new dynamic feature flag.",
)
async def create_feature_flag(
    payload: CreateFeatureFlagRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> FeatureFlagResponse:
    flag = await FeatureFlagService.create_flag(payload, db)
    return FeatureFlagResponse.model_validate(flag)


@router.put(
    "/feature-flags/{flag_id}",
    response_model=FeatureFlagResponse,
    summary="Update Feature Flag",
    description="Updates enablement or rollout percentage for a feature flag.",
)
async def update_feature_flag(
    flag_id: uuid.UUID,
    payload: UpdateFeatureFlagRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> FeatureFlagResponse:
    flag = await FeatureFlagService.update_flag(flag_id, payload, db)
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature flag not found.",
        )
    return FeatureFlagResponse.model_validate(flag)


@router.delete(
    "/feature-flags/{flag_id}",
    summary="Delete Feature Flag",
    description="Deletes a feature flag.",
)
async def delete_feature_flag(
    flag_id: uuid.UUID,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    success = await FeatureFlagService.delete_flag(flag_id, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature flag not found.",
        )
    return {"message": "Feature flag deleted successfully."}


@router.get(
    "/settings",
    response_model=List[SystemSettingResponse],
    summary="List System Settings",
    description="Returns global platform system setting configurations.",
)
async def get_system_settings(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> List[SystemSettingResponse]:
    settings_list = await SettingsService.get_all_settings(db)
    return [SystemSettingResponse.model_validate(s) for s in settings_list]


@router.put(
    "/settings",
    response_model=SystemSettingResponse,
    summary="Set System Setting",
    description="Creates or updates a key-value system setting configuration.",
)
async def set_system_setting(
    payload: SystemSettingRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> SystemSettingResponse:
    setting = await SettingsService.set_setting(payload, admin_user.id, db)
    return SystemSettingResponse.model_validate(setting)


@router.post(
    "/maintenance/enable",
    response_model=MaintenanceModeResponse,
    summary="Enable Maintenance Mode",
    description="Enables platform maintenance mode and broadcasts warning to connected WebSocket clients.",
)
async def enable_maintenance_mode(
    payload: EnableMaintenanceRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> MaintenanceModeResponse:
    mode = await MaintenanceService.enable_maintenance(payload, admin_user.id, db)
    return MaintenanceModeResponse.model_validate(mode)


@router.post(
    "/maintenance/disable",
    response_model=MaintenanceModeResponse,
    summary="Disable Maintenance Mode",
    description="Disables maintenance mode and restores normal system operations.",
)
async def disable_maintenance_mode(
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> MaintenanceModeResponse:
    mode = await MaintenanceService.disable_maintenance(admin_user.id, db)
    return MaintenanceModeResponse.model_validate(mode)


@router.post(
    "/notifications/broadcast",
    summary="Broadcast System Announcement",
    description="Broadcasts platform announcement to all connected WebSocket clients.",
)
async def broadcast_announcement(
    payload: BroadcastNotificationRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    return await AdminService.broadcast_announcement(payload, admin_user.id, db)
