from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut


class EmployeeService:
    def __init__(self, db: Session):
        self.db = db

    def list(self, company_id: str) -> list[EmployeeOut]:
        employees = (
            self.db.query(Employee)
            .filter(Employee.company_id == company_id)
            .order_by(Employee.name)
            .all()
        )
        return [EmployeeOut.model_validate(e) for e in employees]

    def create(self, company_id: str, data: EmployeeCreate) -> EmployeeOut:
        employee = Employee(
            company_id=company_id,
            name=data.name.strip(),
            role=data.role.strip() if data.role else None,
        )
        self.db.add(employee)
        self.db.commit()
        self.db.refresh(employee)
        return EmployeeOut.model_validate(employee)

    def update(self, company_id: str, employee_id: str, data: EmployeeUpdate) -> EmployeeOut:
        emp = self.db.query(Employee).filter(
            Employee.id == employee_id, Employee.company_id == company_id
        ).first()
        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
        if data.name is not None:
            emp.name = data.name.strip()
        if data.role is not None:
            emp.role = data.role.strip() or None
        self.db.commit()
        self.db.refresh(emp)
        return EmployeeOut.model_validate(emp)

    def delete(self, company_id: str, employee_id: str) -> None:
        emp = self.db.query(Employee).filter(
            Employee.id == employee_id, Employee.company_id == company_id
        ).first()
        if not emp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
        self.db.delete(emp)
        self.db.commit()
