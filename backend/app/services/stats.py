from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models import Point, SurveyAnswer, SurveySession
from app.schemas import OptionStats, QuestionStats, StatsFilter, SurveyStatsOut
from app.survey import QUESTION_OPTIONS, QUESTION_ORDER, SessionStatus

RATE_PRECISION = 4


def share(hits: int, total: int) -> float | None:
    return round(hits / total, RATE_PRECISION) if total else None


def local_midnight(day: date, zone: ZoneInfo) -> datetime:
    return datetime.combine(day, time.min, tzinfo=zone).astimezone(UTC)


def apply_filters[T: Select](query: T, filters: StatsFilter, zone: ZoneInfo) -> T:
    if filters.date_from and filters.date_to and filters.date_from > filters.date_to:
        raise HTTPException(status_code=422, detail="invalid_period")
    if filters.date_from:
        query = query.where(SurveySession.started_at >= local_midnight(filters.date_from, zone))
    if filters.date_to:
        query = query.where(SurveySession.started_at < local_midnight(filters.date_to + timedelta(days=1), zone))
    if filters.region:
        query = query.where(Point.region == filters.region)
    if filters.store:
        query = query.where(Point.store == filters.store)
    if filters.point_id is not None:
        query = query.where(Point.id == filters.point_id)
    return query


def build_survey_stats(db: Session, filters: StatsFilter, zone: ZoneInfo) -> SurveyStatsOut:
    sessions_query = apply_filters(
        select(SurveySession.status, func.count())
        .join(Point, Point.id == SurveySession.point_id)
        .group_by(SurveySession.status),
        filters,
        zone,
    )
    sessions_by_status = {status: count for status, count in db.execute(sessions_query)}

    answers_query = apply_filters(
        select(SurveyAnswer.question, SurveyAnswer.option, func.count())
        .join(SurveySession, SurveySession.id == SurveyAnswer.session_id)
        .join(Point, Point.id == SurveySession.point_id)
        .group_by(SurveyAnswer.question, SurveyAnswer.option),
        filters,
        zone,
    )
    counts = {(question, option): count for question, option, count in db.execute(answers_query)}

    questions = []
    for question in QUESTION_ORDER:
        option_counts = [(option, counts.get((question.value, option), 0)) for option in QUESTION_OPTIONS[question]]
        total = sum(count for _, count in option_counts)
        questions.append(
            QuestionStats(
                question=question,
                total=total,
                options=[OptionStats(option=option, count=count, rate=share(count, total)) for option, count in option_counts],
            )
        )

    return SurveyStatsOut(
        sessions=sum(sessions_by_status.values()),
        completed_sessions=sessions_by_status.get(SessionStatus.COMPLETED.value, 0),
        questions=questions,
    )
