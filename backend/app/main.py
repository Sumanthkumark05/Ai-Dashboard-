from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.routes.activity import router as activity_router
from app.api.v1.routes.admin import router as admin_router
from app.api.v1.routes.api_keys import router as api_keys_router
from app.api.v1.routes.audit import router as audit_router
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.datasets import router as datasets_router
from app.api.v1.routes.documents import router as documents_router
from app.api.v1.routes.files import router as files_router
from app.api.v1.routes.folders import router as folders_router
from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.invitations import router as invitations_router
from app.api.v1.routes.invitations_api import router as team_invitations_router
from app.api.v1.routes.jobs import router as jobs_router
from app.api.v1.routes.login_history_api import router as login_history_router
from app.api.v1.routes.organizations import router as organizations_router
from app.api.v1.routes.permissions import router as permissions_router
from app.api.v1.routes.roles import router as roles_router
from app.api.v1.routes.security_events import router as security_events_router
from app.api.v1.routes.sessions import router as sessions_router
from app.api.v1.routes.teams import router as teams_router
from app.api.v1.routes.uploads import router as uploads_router
from app.api.v1.routes.users import router as users_router
from app.api.v1.routes.chat import router as chat_router
from app.api.v1.routes.analytics import router as analytics_router
from app.api.v1.routes.calendar import router as calendar_router
from app.api.v1.routes.dashboard import router as dashboard_router
from app.api.v1.routes.mail import router as mail_router
from app.api.v1.routes.reports import router as reports_router
from app.api.v1.routes.workspaces import router as workspaces_router
from app.api.v1.routes.ws import router as ws_router





from app.core.config import settings
from app.core.exceptions import (
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.lifespan import lifespan
from app.core.middleware import register_middlewares
from app.schemas.health import MessageResponse


def create_application() -> FastAPI:
    """
    Factory function to initialize and configure the production FastAPI application instance.
    """
    app = FastAPI(
        title=f"{settings.APP_NAME} API",
        description="Production Backend for NeuroDesk AI SaaS Platform",
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # 1. Register Middlewares
    register_middlewares(app)

    # 2. Register Global Exception Handlers
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # 3. Root Endpoint
    @app.get(
        "/",
        response_model=MessageResponse,
        tags=["Root"],
        summary="Root Welcome Endpoint",
        description="Returns global welcome message for NeuroDesk AI backend.",
    )
    async def root() -> MessageResponse:
        return MessageResponse(message="Welcome to NeuroDesk AI Backend")

    # 4. Include Versioned Routers (/api/v1) & WebSocket Endpoints
    app.include_router(health_router, prefix=settings.API_PREFIX)
    app.include_router(auth_router, prefix=settings.API_PREFIX)
    app.include_router(users_router, prefix=settings.API_PREFIX)
    app.include_router(roles_router, prefix=settings.API_PREFIX)
    app.include_router(permissions_router, prefix=settings.API_PREFIX)
    app.include_router(sessions_router, prefix=settings.API_PREFIX)
    app.include_router(organizations_router, prefix=settings.API_PREFIX)
    app.include_router(invitations_router, prefix=settings.API_PREFIX)
    app.include_router(workspaces_router, prefix=settings.API_PREFIX)
    app.include_router(documents_router, prefix=settings.API_PREFIX)
    app.include_router(datasets_router, prefix=settings.API_PREFIX)
    app.include_router(uploads_router, prefix=settings.API_PREFIX)
    app.include_router(teams_router, prefix=settings.API_PREFIX)
    app.include_router(team_invitations_router, prefix=settings.API_PREFIX)
    app.include_router(folders_router, prefix=settings.API_PREFIX)
    app.include_router(files_router, prefix=settings.API_PREFIX)
    app.include_router(jobs_router, prefix=settings.API_PREFIX)
    app.include_router(api_keys_router, prefix=settings.API_PREFIX)
    app.include_router(audit_router, prefix=settings.API_PREFIX)
    app.include_router(activity_router, prefix=settings.API_PREFIX)
    app.include_router(security_events_router, prefix=settings.API_PREFIX)
    app.include_router(login_history_router, prefix=settings.API_PREFIX)
    app.include_router(chat_router, prefix=settings.API_PREFIX)
    app.include_router(dashboard_router, prefix=settings.API_PREFIX)
    app.include_router(analytics_router, prefix=settings.API_PREFIX)
    app.include_router(calendar_router, prefix=settings.API_PREFIX)
    app.include_router(mail_router, prefix=settings.API_PREFIX)
    app.include_router(reports_router, prefix=settings.API_PREFIX)

    app.include_router(admin_router, prefix=settings.API_PREFIX)
    app.include_router(ws_router)




    return app













# Application Entry Instance
app = create_application()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
