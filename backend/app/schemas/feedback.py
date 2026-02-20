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

    class Config:
        from_attributes = True


class FeedbackStats(BaseModel):
    total: int
    average_rating: float | None
    distribution: dict[str, int]


class FeedbackHighlights(BaseModel):
    top3: list[FeedbackOut]
    worst3: list[FeedbackOut]


class QRCodePublicInfo(BaseModel):
    uuid: str
    label: str
    company_name: str
    is_active: bool
