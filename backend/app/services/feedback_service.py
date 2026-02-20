from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.qr_code import QRCode
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackSubmit, FeedbackOut, FeedbackStats, QRCodePublicInfo


class FeedbackService:
    def __init__(self, db: Session):
        self.db = db

    def get_qr_info(self, uuid: str) -> QRCodePublicInfo:
        qr = self.db.query(QRCode).filter(QRCode.uuid == uuid).first()
        if not qr:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code not found")
        return QRCodePublicInfo(
            uuid=qr.uuid,
            label=qr.label,
            company_name=qr.company.name,
            is_active=qr.is_active,
        )

    def submit(self, uuid: str, data: FeedbackSubmit, ip_address: str | None) -> FeedbackOut:
        qr = self.db.query(QRCode).filter(QRCode.uuid == uuid).first()
        if not qr:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code not found")
        if not qr.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="QR code is inactive")

        fb = Feedback(
            qr_code_id=qr.id,
            company_id=qr.company_id,
            rating=data.rating,
            comment=data.comment,
            ip_address=ip_address,
        )
        self.db.add(fb)
        self.db.commit()
        self.db.refresh(fb)
        return FeedbackOut.model_validate(fb)

    def list(self, company_id: str, page: int = 1, page_size: int = 20) -> list[FeedbackOut]:
        offset = (page - 1) * page_size
        feedbacks = (
            self.db.query(Feedback)
            .filter(Feedback.company_id == company_id)
            .order_by(Feedback.created_at.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )
        return [FeedbackOut.model_validate(f) for f in feedbacks]

    def get_stats(self, company_id: str) -> FeedbackStats:
        total = self.db.query(func.count(Feedback.id)).filter(
            Feedback.company_id == company_id
        ).scalar() or 0

        avg = self.db.query(func.avg(Feedback.rating)).filter(
            Feedback.company_id == company_id
        ).scalar()

        distribution = {}
        for i in range(1, 11):
            count = self.db.query(func.count(Feedback.id)).filter(
                Feedback.company_id == company_id,
                Feedback.rating == i,
            ).scalar() or 0
            distribution[str(i)] = count

        return FeedbackStats(
            total=total,
            average_rating=round(float(avg), 2) if avg else None,
            distribution=distribution,
        )

    def list_all(self, page: int = 1, page_size: int = 50) -> list[FeedbackOut]:
        offset = (page - 1) * page_size
        feedbacks = (
            self.db.query(Feedback)
            .order_by(Feedback.created_at.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )
        return [FeedbackOut.model_validate(f) for f in feedbacks]
