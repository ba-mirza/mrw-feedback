from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings, validate_production_settings
from app.errors import register_error_handlers
from app.routes import auth, health, points, stats, survey


def create_app() -> FastAPI:
    settings = get_settings()
    validate_production_settings(settings)
    docs_enabled = settings.ENABLE_API_DOCS and not settings.is_production
    app = FastAPI(
        title=settings.APP_NAME,
        docs_url="/docs" if docs_enabled else None,
        redoc_url=None,
        openapi_url="/openapi.json" if docs_enabled else None,
    )
    if settings.CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.CORS_ORIGINS,
            allow_methods=["GET", "POST", "PUT"],
            allow_headers=["Authorization", "Content-Type"],
        )
    register_error_handlers(app)
    for module in (health, auth, points, survey, stats):
        app.include_router(module.router)
    return app


app = create_app()
