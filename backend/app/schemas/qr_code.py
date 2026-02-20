from datetime import datetime
from pydantic import BaseModel


class QRCodeCreate(BaseModel):
    label: str


class QRCodeOut(BaseModel):
    id: str
    company_id: str
    uuid: str
    label: str
    is_active: bool
    created_at: datetime
    image_base64: str | None = None

    class Config:
        from_attributes = True
