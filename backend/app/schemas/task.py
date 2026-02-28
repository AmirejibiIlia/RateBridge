from datetime import datetime
from pydantic import BaseModel

VALID_STATUSES = {"backlog", "in_progress", "resolved", "rejected"}


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    status: str = "backlog"
    assigned_to_id: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    assigned_to_id: str | None = None


class TaskOut(BaseModel):
    id: str
    company_id: str
    title: str
    description: str | None
    status: str
    assigned_to_id: str | None
    assigned_to_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskStats(BaseModel):
    total: int
    backlog: int
    in_progress: int
    resolved: int
    rejected: int
