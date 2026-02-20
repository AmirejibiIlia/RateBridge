import random
import string

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import RegisterRequest, LoginRequest


def _make_slug(name: str) -> str:
    base = name.lower().replace(" ", "-")
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"{base}-{suffix}"


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, data: RegisterRequest) -> dict:
        if self.db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        slug = _make_slug(data.company_name)
        company = Company(name=data.company_name, slug=slug)
        self.db.add(company)
        self.db.flush()

        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            company_id=company.id,
            is_super_admin=False,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        token = create_access_token({"sub": user.id})
        return {"access_token": token, "token_type": "bearer"}

    def login(self, data: LoginRequest) -> dict:
        user = self.db.query(User).filter(User.email == data.email).first()
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        token = create_access_token({"sub": user.id})
        return {"access_token": token, "token_type": "bearer"}

    def create_super_admin(self, email: str, password: str) -> User:
        existing = self.db.query(User).filter(User.email == email).first()
        if existing:
            return existing
        user = User(
            email=email,
            password_hash=hash_password(password),
            company_id=None,
            is_super_admin=True,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
