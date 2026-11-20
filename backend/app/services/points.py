import io
from typing import Literal

import segno
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import Settings
from app.models import Point
from app.schemas import PointInput, PointOut
from app.security import generate_point_code

QrFormat = Literal["svg", "png"]

QR_ERROR_LEVEL = "m"
QR_SCALE = {"svg": 10, "png": 20}
QR_BORDER = 2
CODE_ATTEMPTS = 5


def survey_url(code: str, settings: Settings) -> str:
    return f"{settings.SURVEY_BASE_URL.rstrip('/')}/s/{code}"


def to_point_out(point: Point, settings: Settings) -> PointOut:
    return PointOut(
        id=point.id,
        code=point.code,
        region=point.region,
        store=point.store,
        register_number=point.register_number,
        is_active=point.is_active,
        survey_url=survey_url(point.code, settings),
        created_at=point.created_at,
        updated_at=point.updated_at,
    )


def list_points(db: Session) -> list[Point]:
    return list(db.scalars(select(Point).order_by(Point.region, Point.store, Point.register_number)))


def get_point(db: Session, point_id: int) -> Point:
    point = db.get(Point, point_id)
    if point is None:
        raise HTTPException(status_code=404, detail="point_not_found")
    return point


def is_unique_code(db: Session, code: str) -> bool:
    return db.scalars(select(Point.id).where(Point.code == code)).first() is None


def new_unique_code(db: Session) -> str:
    for _ in range(CODE_ATTEMPTS):
        code = generate_point_code()
        if is_unique_code(db, code):
            return code
    raise RuntimeError("could not generate a unique point code")


def commit_point(db: Session, point: Point) -> Point:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="point_exists") from None
    db.refresh(point)
    return point


def create_point(db: Session, data: PointInput) -> Point:
    point = Point(code=new_unique_code(db), **data.model_dump())
    db.add(point)
    return commit_point(db, point)


def update_point(db: Session, point_id: int, data: PointInput) -> Point:
    point = get_point(db, point_id)
    for field, value in data.model_dump().items():
        setattr(point, field, value)
    return commit_point(db, point)


def render_qr(url: str, qr_format: QrFormat) -> bytes:
    qr = segno.make(url, error=QR_ERROR_LEVEL)
    buffer = io.BytesIO()
    qr.save(buffer, kind=qr_format, scale=QR_SCALE[qr_format], border=QR_BORDER)
    return buffer.getvalue()
