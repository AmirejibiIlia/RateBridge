import uuid

from sqlalchemy import String, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, utcnow


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id: Mapped[str] = mapped_column(String, ForeignKey("companies.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # backlog | in_progress | resolved | rejected
    status: Mapped[str] = mapped_column(String(50), default="backlog", nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    company = relationship("Company", back_populates="tasks")
