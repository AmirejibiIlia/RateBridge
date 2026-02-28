from datetime import datetime
from pydantic import BaseModel


class EmployeeCreate(BaseModel):
    name: str
    role: str | None = None


class EmployeeUpdate(BaseModel):
    name: str | None = None
    role: str | None = None


class EmployeeOut(BaseModel):
    id: str
    company_id: str
    name: str
    role: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
