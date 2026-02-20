from datetime import datetime
from pydantic import BaseModel


class CompanyOut(BaseModel):
    id: str
    name: str
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True


class CompanyStats(BaseModel):
    company: CompanyOut
    total_feedback: int
    average_rating: float | None
    total_qr_codes: int
    active_qr_codes: int
