from __future__ import annotations

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.company import Company
from app.models.qr_code import QRCode
from app.models.feedback import Feedback
from app.schemas.company import CompanyOut, CompanyStats


class CompanyService:
    def __init__(self, db: Session):
        self.db = db

    def get_stats(self, company_id: str) -> CompanyStats:
        company = self.db.query(Company).filter(Company.id == company_id).first()

        total_feedback = self.db.query(func.count(Feedback.id)).filter(
            Feedback.company_id == company_id
        ).scalar() or 0

        avg_rating = self.db.query(func.avg(Feedback.rating)).filter(
            Feedback.company_id == company_id
        ).scalar()

        total_qr = self.db.query(func.count(QRCode.id)).filter(
            QRCode.company_id == company_id
        ).scalar() or 0

        active_qr = self.db.query(func.count(QRCode.id)).filter(
            QRCode.company_id == company_id,
            QRCode.is_active == True,
        ).scalar() or 0

        return CompanyStats(
            company=CompanyOut.model_validate(company),
            total_feedback=total_feedback,
            average_rating=round(float(avg_rating), 2) if avg_rating else None,
            total_qr_codes=total_qr,
            active_qr_codes=active_qr,
        )

    def list_all(self) -> list[CompanyStats]:
        companies = self.db.query(Company).all()
        return [self.get_stats(c.id) for c in companies]
