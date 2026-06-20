from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
import app.models  # noqa: F401  (register all models)
from app.routers import (auth, masters, products, boms, sales, purchase,
                         manufacturing, audit, dashboard, ai, reports,
                         admin_users, analytics)

app = FastAPI(title=settings.APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Build in-memory permission cache from roles/permissions tables.
# Runs once at startup; zero DB queries during normal request handling.
# Gracefully no-ops if tables are empty (pre-seed state — Admin bypass still works).
from app.core.permissions import build_permission_cache
with SessionLocal() as _startup_db:
    build_permission_cache(_startup_db)

for r in (auth, masters, products, boms, sales, purchase, manufacturing,
          audit, dashboard, ai, reports, admin_users, analytics):
    app.include_router(r.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}
