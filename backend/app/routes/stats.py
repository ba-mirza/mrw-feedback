from typing import Annotated

from fastapi import APIRouter, Query

from app.deps import AppSettings, CurrentAdmin, DbSession
from app.schemas import PointStatsOut, StatsFilter, StatsGranularity, SummaryOut, TimelineOut
from app.services import stats as service

router = APIRouter(prefix="/v1/admin/stats", tags=["stats"])

Filters = Annotated[StatsFilter, Query()]


@router.get("/summary")
def summary(filters: Filters, db: DbSession, settings: AppSettings, _: CurrentAdmin) -> SummaryOut:
    return service.build_summary(db, filters, settings.zone)


@router.get("/timeline")
def timeline(
    filters: Filters,
    db: DbSession,
    settings: AppSettings,
    _: CurrentAdmin,
    granularity: Annotated[StatsGranularity, Query()] = "day",
) -> TimelineOut:
    return service.build_timeline(db, filters, granularity, settings.zone)


@router.get("/points")
def points(filters: Filters, db: DbSession, settings: AppSettings, _: CurrentAdmin) -> PointStatsOut:
    return PointStatsOut(items=service.build_point_stats(db, filters, settings.zone))
