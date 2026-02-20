from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.feedback import FeedbackSubmit, FeedbackOut, QRCodePublicInfo
from app.services.feedback_service import FeedbackService

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.get("/{uuid}", response_model=QRCodePublicInfo)
def get_qr_info(uuid: str, db: Session = Depends(get_db)):
    return FeedbackService(db).get_qr_info(uuid)


@router.post("/{uuid}", response_model=FeedbackOut)
def submit_feedback(uuid: str, data: FeedbackSubmit, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    return FeedbackService(db).submit(uuid, data, ip)
