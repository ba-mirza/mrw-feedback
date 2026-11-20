from typing import Annotated

from fastapi import APIRouter, Query

from app.deps import AppSettings, CurrentAdmin, DbSession
from app.schemas import StatsFilter, SurveyStatsOut
from app.services import stats as service

router = APIRouter(prefix="/v1/admin/stats", tags=["stats"])


@router.get("/questions")
def questions(
    filters: Annotated[StatsFilter, Query()], db: DbSession, settings: AppSettings, _: CurrentAdmin
) -> SurveyStatsOut:
    return service.build_survey_stats(db, filters, settings.zone)
