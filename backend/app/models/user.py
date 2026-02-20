import uuid

from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    company_id: Mapped[str | None] = mapped_column(String, ForeignKey("companies.id"), nullable=True)
    is_super_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    company = relationship("Company", back_populates="users")
