from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # noqa: F401  (register all models)
from app.routers import (auth, masters, products, boms, sales, purchase,
                         manufacturing, audit, dashboard, ai, reports)

app = FastAPI(title=settings.APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

for r in (auth, masters, products, boms, sales, purchase, manufacturing,
          audit, dashboard, ai, reports):
    app.include_router(r.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}
