from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut, TaskStats, VALID_STATUSES


class TaskService:
    def __init__(self, db: Session):
        self.db = db

    def list(self, company_id: str, status_filter: str | None = None) -> list[TaskOut]:
        q = self.db.query(Task).filter(Task.company_id == company_id)
        if status_filter and status_filter in VALID_STATUSES:
            q = q.filter(Task.status == status_filter)
        tasks = q.order_by(Task.created_at.desc()).all()
        return [TaskOut.model_validate(t) for t in tasks]

    def create(self, company_id: str, data: TaskCreate) -> TaskOut:
        if data.status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}")
        task = Task(
            company_id=company_id,
            title=data.title.strip(),
            description=data.description,
            status=data.status,
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return TaskOut.model_validate(task)

    def update(self, company_id: str, task_id: str, data: TaskUpdate) -> TaskOut:
        task = self.db.query(Task).filter(Task.id == task_id, Task.company_id == company_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        if data.title is not None:
            task.title = data.title.strip()
        if data.description is not None:
            task.description = data.description
        if data.status is not None:
            if data.status not in VALID_STATUSES:
                raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}")
            task.status = data.status
        self.db.commit()
        self.db.refresh(task)
        return TaskOut.model_validate(task)

    def delete(self, company_id: str, task_id: str) -> None:
        task = self.db.query(Task).filter(Task.id == task_id, Task.company_id == company_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        self.db.delete(task)
        self.db.commit()

    def get_stats(self, company_id: str) -> TaskStats:
        rows = (
            self.db.query(Task.status, func.count(Task.id))
            .filter(Task.company_id == company_id)
            .group_by(Task.status)
            .all()
        )
        counts = {row[0]: row[1] for row in rows}
        total = sum(counts.values())
        return TaskStats(
            total=total,
            backlog=counts.get("backlog", 0),
            in_progress=counts.get("in_progress", 0),
            resolved=counts.get("resolved", 0),
            rejected=counts.get("rejected", 0),
        )
