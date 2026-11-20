from typing import Annotated

from fastapi import APIRouter, Query, Response

from app.deps import AppSettings, CurrentAdmin, DbSession
from app.schemas import PointInput, PointList, PointOut
from app.services import points as service

router = APIRouter(prefix="/v1/admin/points", tags=["points"])

QR_MEDIA_TYPES = {"svg": "image/svg+xml", "png": "image/png"}


@router.get("")
def list_points(db: DbSession, settings: AppSettings, _: CurrentAdmin) -> PointList:
    return PointList(items=[service.to_point_out(point, settings) for point in service.list_points(db)])


@router.post("", status_code=201)
def create_point(data: PointInput, db: DbSession, settings: AppSettings, _: CurrentAdmin) -> PointOut:
    return service.to_point_out(service.create_point(db, data), settings)


@router.get("/{point_id}")
def get_point(point_id: int, db: DbSession, settings: AppSettings, _: CurrentAdmin) -> PointOut:
    return service.to_point_out(service.get_point(db, point_id), settings)


@router.put("/{point_id}")
def update_point(point_id: int, data: PointInput, db: DbSession, settings: AppSettings, _: CurrentAdmin) -> PointOut:
    return service.to_point_out(service.update_point(db, point_id, data), settings)


@router.get("/{point_id}/qr")
def point_qr(
    point_id: int,
    db: DbSession,
    settings: AppSettings,
    _: CurrentAdmin,
    format: Annotated[service.QrFormat, Query()] = "svg",
) -> Response:
    point = service.get_point(db, point_id)
    content = service.render_qr(service.survey_url(point.code, settings), format)
    filename = f"qr-{point.code}.{format}"
    return Response(
        content=content,
        media_type=QR_MEDIA_TYPES[format],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
