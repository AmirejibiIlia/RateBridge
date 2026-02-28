import random
import string

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.partnership_request import PartnershipRequest
from app.models.user import User
from app.core.security import hash_password
from app.schemas.partnership import PartnershipRequestCreate, RegisterCompanyFromRequest


def _make_slug(name: str) -> str:
    base = name.lower().replace(" ", "-")
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"{base}-{suffix}"


class PartnershipService:
    def __init__(self, db: Session):
        self.db = db

    def create_request(self, data: PartnershipRequestCreate) -> PartnershipRequest:
        req = PartnershipRequest(
            company_name=data.company_name,
            email=data.email,
            phone=data.phone,
            status="pending",
        )
        self.db.add(req)
        self.db.commit()
        self.db.refresh(req)
        return req

    def list_requests(self) -> list[PartnershipRequest]:
        return (
            self.db.query(PartnershipRequest)
            .order_by(PartnershipRequest.created_at.desc())
            .all()
        )

    def approve_request(self, request_id: str, data: RegisterCompanyFromRequest) -> dict:
        req = self.db.query(PartnershipRequest).filter(PartnershipRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
        if req.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request already processed")

        if self.db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        slug = _make_slug(req.company_name)
        company = Company(name=req.company_name, slug=slug)
        self.db.add(company)
        self.db.flush()

        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            company_id=company.id,
            is_super_admin=False,
        )
        self.db.add(user)

        req.status = "approved"
        self.db.commit()
        return {"message": "Company registered successfully"}

    def delete_request(self, request_id: str) -> dict:
        req = self.db.query(PartnershipRequest).filter(PartnershipRequest.id == request_id).first()
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
        self.db.delete(req)
        self.db.commit()
        return {"message": "Request deleted"}
