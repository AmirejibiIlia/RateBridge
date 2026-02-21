from datetime import datetime
from pydantic import BaseModel, Field


class FeedbackSubmit(BaseModel):
    rating: int = Field(..., ge=1, le=10)
    comment: str | None = None


class FeedbackOut(BaseModel):
    id: str
    qr_code_id: str
    company_id: str
    rating: int
    comment: str | None
    ip_address: str | None
    created_at: datetime
    qr_label: str | None = None

    class Config:
        from_attributes = True


class FeedbackStats(BaseModel):
    total: int
    average_rating: float | None
    distribution: dict[str, int]


class FeedbackHighlights(BaseModel):
    top3: list[FeedbackOut]
    worst3: list[FeedbackOut]


class TimelineEntry(BaseModel):
    label: str
    r1: int = 0
    r2: int = 0
    r3: int = 0
    r4: int = 0
    r5: int = 0
    r6: int = 0
    r7: int = 0
    r8: int = 0
    r9: int = 0
    r10: int = 0


class FeedbackTimeline(BaseModel):
    daily: list[TimelineEntry]
    weekly: list[TimelineEntry]


class QRCodePublicInfo(BaseModel):
    uuid: str
    label: str
    company_name: str
    is_active: bool


class FeedbackSummaryRequest(BaseModel):
    date_from: str  # ISO date: YYYY-MM-DD
    date_to: str    # ISO date: YYYY-MM-DD
    categories: list[str]


class FeedbackSummaryResponse(BaseModel):
    summary: str
    feedback_count: int
