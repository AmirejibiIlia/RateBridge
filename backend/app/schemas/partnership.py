from datetime import datetime

from pydantic import BaseModel, EmailStr


class PartnershipRequestCreate(BaseModel):
    company_name: str
    email: EmailStr
    phone: str


class PartnershipRequestOut(BaseModel):
    id: str
    company_name: str
    email: str
    phone: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class RegisterCompanyFromRequest(BaseModel):
    email: EmailStr
    password: str
