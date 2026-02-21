from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    company_name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    new_password: str


class UserOut(BaseModel):
    id: str
    email: str
    company_id: str | None
    is_super_admin: bool

    class Config:
        from_attributes = True
