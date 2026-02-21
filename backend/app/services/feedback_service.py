from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.qr_code import QRCode
from app.models.feedback import Feedback
from datetime import datetime, timedelta, timezone

from app.schemas.feedback import (
    FeedbackSubmit, FeedbackOut, FeedbackStats,
    FeedbackHighlights, FeedbackTimeline, TimelineEntry, QRCodePublicInfo,
)


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

    def get_qr_stats(self, qr_code_id: str) -> FeedbackStats:
        total = self.db.query(func.count(Feedback.id)).filter(
            Feedback.qr_code_id == qr_code_id
        ).scalar() or 0

        avg = self.db.query(func.avg(Feedback.rating)).filter(
            Feedback.qr_code_id == qr_code_id
        ).scalar()

        distribution = {}
        for i in range(1, 11):
            count = self.db.query(func.count(Feedback.id)).filter(
                Feedback.qr_code_id == qr_code_id,
                Feedback.rating == i,
            ).scalar() or 0
            distribution[str(i)] = count

        return FeedbackStats(
            total=total,
            average_rating=round(float(avg), 2) if avg else None,
            distribution=distribution,
        )

    def get_highlights(self, company_id: str) -> FeedbackHighlights:
        top3 = (
            self.db.query(Feedback)
            .filter(Feedback.company_id == company_id)
            .order_by(Feedback.rating.desc(), Feedback.created_at.desc())
            .limit(3)
            .all()
        )
        worst3 = (
            self.db.query(Feedback)
            .filter(Feedback.company_id == company_id)
            .order_by(Feedback.rating.asc(), Feedback.created_at.desc())
            .limit(3)
            .all()
        )
        return FeedbackHighlights(
            top3=[FeedbackOut.model_validate(f) for f in top3],
            worst3=[FeedbackOut.model_validate(f) for f in worst3],
        )

    def get_timeline(self, company_id: str) -> FeedbackTimeline:
        now = datetime.now(timezone.utc)
        since = now - timedelta(days=30)

        feedbacks = (
            self.db.query(Feedback)
            .filter(Feedback.company_id == company_id, Feedback.created_at >= since)
            .all()
        )

        # --- Daily: last 30 days ---
        daily_map: dict[str, dict[int, int]] = {}
        for i in range(30):
            day = (now - timedelta(days=29 - i)).strftime("%b %d")
            daily_map[day] = {r: 0 for r in range(1, 11)}

        for fb in feedbacks:
            day = fb.created_at.strftime("%b %d")
            if day in daily_map:
                daily_map[day][fb.rating] += 1

        daily = [
            TimelineEntry(label=day, **{f"r{r}": daily_map[day][r] for r in range(1, 11)})
            for day in daily_map
        ]

        # --- Weekly: last 4 weeks (each = 7 days) ---
        weekly_map: dict[str, dict[int, int]] = {}
        week_labels = []
        for i in range(4):
            week_start = now - timedelta(days=27 - i * 7)
            label = "Wk " + week_start.strftime("%b %d")
            week_labels.append(label)
            weekly_map[label] = {r: 0 for r in range(1, 11)}

        for fb in feedbacks:
            days_ago = (now - fb.created_at).days
            week_index = min(days_ago // 7, 3)
            label = week_labels[3 - week_index]
            weekly_map[label][fb.rating] += 1

        weekly = [
            TimelineEntry(label=lbl, **{f"r{r}": weekly_map[lbl][r] for r in range(1, 11)})
            for lbl in week_labels
        ]

        return FeedbackTimeline(daily=daily, weekly=weekly)

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
