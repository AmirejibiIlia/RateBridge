from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import requests as http_requests

from app.models.qr_code import QRCode
from app.models.feedback import Feedback
from datetime import datetime, timedelta, timezone, date

from app.schemas.feedback import (
    FeedbackSubmit, FeedbackOut, FeedbackStats,
    FeedbackHighlights, FeedbackTimeline, TimelineEntry, QRCodePublicInfo,
    FeedbackSummaryRequest, FeedbackSummaryResponse,
)
from app.config import settings


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
        return [
            FeedbackOut(
                id=f.id,
                qr_code_id=f.qr_code_id,
                company_id=f.company_id,
                rating=f.rating,
                comment=f.comment,
                ip_address=f.ip_address,
                created_at=f.created_at,
                qr_label=f.qr_code.label if f.qr_code else None,
            )
            for f in feedbacks
        ]

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

    def get_timeline(self, company_id: str, qr_code_id: str | None = None) -> FeedbackTimeline:
        now = datetime.now(timezone.utc)
        since = now - timedelta(days=30)

        q = self.db.query(Feedback).filter(
            Feedback.company_id == company_id,
            Feedback.created_at >= since,
        )
        if qr_code_id:
            q = q.filter(Feedback.qr_code_id == qr_code_id)
        feedbacks = q.all()

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

    def generate_summary(self, company_id: str, req: FeedbackSummaryRequest) -> FeedbackSummaryResponse:
        if not settings.GEMINI_API_KEY:
            raise HTTPException(status_code=503, detail="AI summary is not configured (missing GEMINI_API_KEY)")

        try:
            date_from = datetime.strptime(req.date_from, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            date_to = datetime.strptime(req.date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")

        feedbacks = (
            self.db.query(Feedback)
            .filter(
                Feedback.company_id == company_id,
                Feedback.created_at >= date_from,
                Feedback.created_at <= date_to,
            )
            .order_by(Feedback.created_at.desc())
            .limit(500)
            .all()
        )

        if not feedbacks:
            return FeedbackSummaryResponse(
                summary="No feedback found in the selected date range.",
                feedback_count=0,
            )

        lines = []
        for i, fb in enumerate(feedbacks, 1):
            qr = fb.qr_code.label if fb.qr_code else "Unknown"
            comment = f'"{fb.comment}"' if fb.comment else "(no comment)"
            lines.append(f"{i}. Rating: {fb.rating}/10, QR: {qr}, Comment: {comment}")

        categories_str = ", ".join(req.categories) + ", Other"
        feedback_text = "\n".join(lines)

        prompt = f"""You are analyzing customer feedback for a CEO report. Be concise and insightful.

Date range: {req.date_from} to {req.date_to}
Total entries: {len(feedbacks)}
Categories to classify into: {categories_str}

Feedback entries:
{feedback_text}

Write a short, punchy CEO summary (5-8 sentences max). Group insights by the categories above. Mention specific counts where possible. If a category has no relevant feedback, note it briefly. End with one overall takeaway sentence."""

        resp = http_requests.post(
            "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
            params={"key": settings.GEMINI_API_KEY},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"maxOutputTokens": 500},
            },
            timeout=30,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"AI service error: {resp.text}")
        summary = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
        return FeedbackSummaryResponse(summary=summary, feedback_count=len(feedbacks))

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
