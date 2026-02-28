from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.partnership import PartnershipRequestCreate, PartnershipRequestOut
from app.services.partnership_service import PartnershipService

router = APIRouter(prefix="/api/partnership", tags=["partnership"])


@router.post("/request", response_model=PartnershipRequestOut, status_code=201)
def submit_request(data: PartnershipRequestCreate, db: Session = Depends(get_db)):
    return PartnershipService(db).create_request(data)
