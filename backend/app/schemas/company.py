from datetime import datetime
from pydantic import BaseModel


class CompanyUpdate(BaseModel):
    name: str


class LogoUpdate(BaseModel):
    logo_base64: str


class CompanyOut(BaseModel):
    id: str
    name: str
    slug: str
    logo_base64: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class CompanyStats(BaseModel):
    company: CompanyOut
    total_feedback: int
    average_rating: float | None
    total_qr_codes: int
    active_qr_codes: int
