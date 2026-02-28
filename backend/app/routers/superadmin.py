from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import require_super_admin
from app.models.user import User
from app.schemas.company import CompanyStats
from app.schemas.feedback import FeedbackOut
from app.schemas.partnership import PartnershipRequestOut, RegisterCompanyFromRequest
from app.services.company_service import CompanyService
from app.services.feedback_service import FeedbackService
from app.services.partnership_service import PartnershipService

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


@router.get("/timeline")
def global_timeline(current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return FeedbackService(db).get_global_timeline()


@router.get("/partnership-requests/pending-count")
def partnership_pending_count(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    return {"count": PartnershipService(db).pending_count()}


@router.get("/partnership-requests", response_model=list[PartnershipRequestOut])
def list_partnership_requests(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    return PartnershipService(db).list_requests()


@router.post("/partnership-requests/{request_id}/approve")
def approve_partnership_request(
    request_id: str,
    data: RegisterCompanyFromRequest,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    return PartnershipService(db).approve_request(request_id, data)


@router.delete("/partnership-requests/{request_id}")
def delete_partnership_request(
    request_id: str,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    return PartnershipService(db).delete_request(request_id)
