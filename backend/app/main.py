from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.models import Base
from app.routers import auth, company, feedback, superadmin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Bootstrap super admin
    from app.database import SessionLocal
    from app.services.auth_service import AuthService
    db = SessionLocal()
    try:
        AuthService(db).create_super_admin(
            email=settings.SUPERADMIN_EMAIL,
            password=settings.SUPERADMIN_PASSWORD,
        )
    finally:
        db.close()

    yield


app = FastAPI(title="RateBridge API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(company.router)
app.include_router(feedback.router)
app.include_router(superadmin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
