from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import require_super_admin
from app.models.user import User
from app.schemas.company import CompanyStats
from app.schemas.feedback import FeedbackOut
from app.services.company_service import CompanyService
from app.services.feedback_service import FeedbackService

router = APIRouter(prefix="/api/superadmin", tags=["superadmin"])


@router.get("/companies", response_model=list[CompanyStats])
def list_companies(current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return CompanyService(db).list_all()


@router.get("/feedback", response_model=list[FeedbackOut])
def all_feedback(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    return FeedbackService(db).list_all(page=page, page_size=page_size)
