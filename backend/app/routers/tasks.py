from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import require_company_user
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut, TaskStats
from app.services.task_service import TaskService

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("/stats", response_model=TaskStats)
def task_stats(current_user: User = Depends(require_company_user), db: Session = Depends(get_db)):
    return TaskService(db).get_stats(current_user.company_id)


@router.get("", response_model=list[TaskOut])
def list_tasks(
    status: str | None = Query(None),
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    return TaskService(db).list(current_user.company_id, status_filter=status)


@router.post("", response_model=TaskOut, status_code=201)
def create_task(
    data: TaskCreate,
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    return TaskService(db).create(current_user.company_id, data)


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: str,
    data: TaskUpdate,
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    return TaskService(db).update(current_user.company_id, task_id, data)


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: str,
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    TaskService(db).delete(current_user.company_id, task_id)
