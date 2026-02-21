from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import require_company_user
from app.models.user import User
from app.schemas.company import CompanyStats, CompanyOut, CompanyUpdate
from app.models.company import Company
from app.schemas.qr_code import QRCodeCreate, QRCodeUpdate, QRCodeOut
from app.schemas.feedback import FeedbackOut, FeedbackStats, FeedbackHighlights, FeedbackTimeline
from app.services.company_service import CompanyService
from app.services.qr_service import QRService
from app.services.feedback_service import FeedbackService

router = APIRouter(prefix="/api/company", tags=["company"])


@router.get("/profile", response_model=CompanyOut)
def get_profile(current_user: User = Depends(require_company_user), db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    return CompanyOut.model_validate(company)


@router.patch("/profile", response_model=CompanyOut)
def update_profile(
    data: CompanyUpdate,
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    company.name = data.name
    db.commit()
    db.refresh(company)
    return CompanyOut.model_validate(company)


@router.get("/dashboard", response_model=CompanyStats)
def dashboard(current_user: User = Depends(require_company_user), db: Session = Depends(get_db)):
    return CompanyService(db).get_stats(current_user.company_id)


@router.get("/feedback", response_model=list[FeedbackOut])
def feedback_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    return FeedbackService(db).list(current_user.company_id, page=page, page_size=page_size)


@router.get("/feedback/stats", response_model=FeedbackStats)
def feedback_stats(current_user: User = Depends(require_company_user), db: Session = Depends(get_db)):
    return FeedbackService(db).get_stats(current_user.company_id)


@router.get("/feedback/highlights", response_model=FeedbackHighlights)
def feedback_highlights(current_user: User = Depends(require_company_user), db: Session = Depends(get_db)):
    return FeedbackService(db).get_highlights(current_user.company_id)


@router.get("/feedback/timeline", response_model=FeedbackTimeline)
def feedback_timeline(
    qr_id: str | None = Query(None),
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    return FeedbackService(db).get_timeline(current_user.company_id, qr_code_id=qr_id)


@router.get("/qr-codes", response_model=list[QRCodeOut])
def list_qr_codes(current_user: User = Depends(require_company_user), db: Session = Depends(get_db)):
    return QRService(db).list(current_user.company_id)


@router.post("/qr-codes", response_model=QRCodeOut)
def create_qr_code(
    data: QRCodeCreate,
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    return QRService(db).create(current_user.company_id, data)


@router.get("/qr-codes/{qr_id}/image", response_model=QRCodeOut)
def get_qr_image(
    qr_id: str,
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    return QRService(db).get_image(current_user.company_id, qr_id)


@router.patch("/qr-codes/{qr_id}", response_model=QRCodeOut)
def update_qr_code(
    qr_id: str,
    data: QRCodeUpdate,
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    return QRService(db).update_label(current_user.company_id, qr_id, data)


@router.get("/qr-codes/{qr_id}/stats", response_model=FeedbackStats)
def qr_code_stats(
    qr_id: str,
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    return FeedbackService(db).get_qr_stats(qr_id)


@router.delete("/qr-codes/{qr_id}", status_code=204)
def delete_qr_code(
    qr_id: str,
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    QRService(db).delete(current_user.company_id, qr_id)
