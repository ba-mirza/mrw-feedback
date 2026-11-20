from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.db import get_db
from app.models import Admin
from app.security import InvalidToken, read_access_token

BEARER_PREFIX = "Bearer "

DbSession = Annotated[Session, Depends(get_db)]
AppSettings = Annotated[Settings, Depends(get_settings)]


def get_current_admin(
    db: DbSession,
    settings: AppSettings,
    authorization: Annotated[str | None, Header()] = None,
) -> Admin:
    if not authorization or not authorization.startswith(BEARER_PREFIX):
        raise HTTPException(status_code=401, detail="auth_required")
    try:
        admin_id = read_access_token(authorization.removeprefix(BEARER_PREFIX), settings)
    except InvalidToken:
        raise HTTPException(status_code=401, detail="token_invalid") from None
    admin = db.get(Admin, admin_id)
    if admin is None or not admin.is_active:
        raise HTTPException(status_code=401, detail="token_invalid")
    return admin


CurrentAdmin = Annotated[Admin, Depends(get_current_admin)]
