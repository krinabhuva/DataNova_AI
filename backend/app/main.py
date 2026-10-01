from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ai import router as ai_router
from app.api.analytics import router as analytics_router
from app.api.auth import router as auth_router
from app.api.customers import router as customers_router
from app.api.datasets import router as datasets_router
from app.api.health import router as health_router
from app.api.inventory import router as inventory_router
from app.api.ml import router as ml_router
from app.api.pipelines import router as pipelines_router
from app.api.products import router as products_router
from app.api.reports import router as reports_router
from app.api.sales import router as sales_router
from app.api.users import router as users_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(customers_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(sales_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(datasets_router, prefix="/api")
app.include_router(pipelines_router, prefix="/api")
app.include_router(ml_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(reports_router, prefix="/api")


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"service": settings.app_name, "status": "ok"}