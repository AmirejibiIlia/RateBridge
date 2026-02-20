import base64
import io

import qrcode
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models.qr_code import QRCode
from app.schemas.qr_code import QRCodeCreate, QRCodeOut


def _generate_qr_image(uuid: str) -> str:
    url = f"{settings.FRONTEND_URL}/feedback/{uuid}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()


class QRService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, company_id: str, data: QRCodeCreate) -> QRCodeOut:
        qr = QRCode(company_id=company_id, label=data.label)
        self.db.add(qr)
        self.db.commit()
        self.db.refresh(qr)
        image_b64 = _generate_qr_image(qr.uuid)
        out = QRCodeOut.model_validate(qr)
        out.image_base64 = image_b64
        return out

    def list(self, company_id: str) -> list[QRCodeOut]:
        qrs = self.db.query(QRCode).filter(QRCode.company_id == company_id).all()
        return [QRCodeOut.model_validate(q) for q in qrs]

    def get_image(self, company_id: str, qr_id: str) -> QRCodeOut:
        qr = self.db.query(QRCode).filter(
            QRCode.id == qr_id, QRCode.company_id == company_id
        ).first()
        if not qr:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code not found")
        image_b64 = _generate_qr_image(qr.uuid)
        out = QRCodeOut.model_validate(qr)
        out.image_base64 = image_b64
        return out

    def toggle(self, company_id: str, qr_id: str) -> QRCodeOut:
        qr = self.db.query(QRCode).filter(
            QRCode.id == qr_id, QRCode.company_id == company_id
        ).first()
        if not qr:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code not found")
        qr.is_active = not qr.is_active
        self.db.commit()
        self.db.refresh(qr)
        return QRCodeOut.model_validate(qr)

    def delete(self, company_id: str, qr_id: str) -> None:
        qr = self.db.query(QRCode).filter(
            QRCode.id == qr_id, QRCode.company_id == company_id
        ).first()
        if not qr:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code not found")
        self.db.delete(qr)
        self.db.commit()
