import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlalchemy.orm import DeclarativeBase


def utcnow():
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass
