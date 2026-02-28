from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import require_company_user
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut
from app.services.employee_service import EmployeeService

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("", response_model=list[EmployeeOut])
def list_employees(current_user: User = Depends(require_company_user), db: Session = Depends(get_db)):
    return EmployeeService(db).list(current_user.company_id)


@router.post("", response_model=EmployeeOut, status_code=201)
def create_employee(
    data: EmployeeCreate,
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    return EmployeeService(db).create(current_user.company_id, data)


@router.patch("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    return EmployeeService(db).update(current_user.company_id, employee_id, data)


@router.delete("/{employee_id}", status_code=204)
def delete_employee(
    employee_id: str,
    current_user: User = Depends(require_company_user),
    db: Session = Depends(get_db),
):
    EmployeeService(db).delete(current_user.company_id, employee_id)
