from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select

from app.deps import AppSettings, CurrentAdmin, DbSession
from app.models import Admin
from app.schemas import AdminProfile, AuthTokens, LoginInput
from app.security import create_access_token, verify_password

router = APIRouter(prefix="/v1", tags=["auth"])


@router.post("/auth/login")
def login(data: LoginInput, db: DbSession, settings: AppSettings) -> AuthTokens:
    admin = db.scalars(select(Admin).where(func.lower(Admin.email) == data.email.lower())).first()
    if admin is None or not admin.is_active or not verify_password(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="invalid_credentials")
    token, expires_in = create_access_token(admin.id, settings)
    return AuthTokens(access_token=token, expires_in=expires_in)


@router.get("/admin/me")
def me(admin: CurrentAdmin) -> AdminProfile:
    return AdminProfile(id=admin.id, name=admin.name, email=admin.email)
