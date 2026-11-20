from collections import Counter
from collections.abc import Callable, Hashable
from dataclasses import dataclass, field
from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Point, SurveyAnswer, SurveySession
from app.schemas import (
    PointStatsItem,
    RateMetric,
    StatsFilter,
    StatsGranularity,
    SummaryOut,
    TimelineItem,
    TimelineOut,
)
from app.survey import (
    LOST_DEMAND_OPTIONS,
    QUESTION_OPTIONS,
    RECOMMEND_OPTION,
    SATISFIED_CONSULTANT_OPTION,
    Question,
    SessionStatus,
)

MAX_PERIOD_DAYS = 366
HOURS_IN_DAY = 24
RATE_PRECISION = 4


@dataclass(frozen=True)
class AnswerRow:
    session_id: str
    point_id: int
    started_at: datetime
    status: str
    question: str | None
    option: str | None


@dataclass
class Bucket:
    sessions: set[str] = field(default_factory=set)
    completed: set[str] = field(default_factory=set)
    answers: dict[str, Counter[str]] = field(default_factory=lambda: {q.value: Counter() for q in Question})

    def add(self, row: AnswerRow) -> None:
        self.sessions.add(row.session_id)
        if row.status == SessionStatus.COMPLETED:
            self.completed.add(row.session_id)
        if row.question in self.answers and row.option is not None:
            self.answers[row.question][row.option] += 1

    def metric(self, question: Question, hit_options: frozenset[str]) -> RateMetric:
        counts = self.answers[question.value]
        total = sum(counts.values())
        hits = sum(counts[option] for option in hit_options)
        return RateMetric(total=total, hits=hits, rate=share(hits, total))

    @property
    def completion_rate(self) -> float | None:
        return share(len(self.completed), len(self.sessions))

    @property
    def consultant(self) -> RateMetric:
        return self.metric(Question.CONSULTANT, frozenset({SATISFIED_CONSULTANT_OPTION}))

    @property
    def lost_demand(self) -> RateMetric:
        return self.metric(Question.AVAILABILITY, LOST_DEMAND_OPTIONS)

    @property
    def recommend(self) -> RateMetric:
        return self.metric(Question.NPS, frozenset({RECOMMEND_OPTION}))


def share(hits: int, total: int) -> float | None:
    return round(hits / total, RATE_PRECISION) if total else None


def period_bounds(filters: StatsFilter, zone: ZoneInfo) -> tuple[datetime, datetime]:
    if filters.date_from > filters.date_to:
        raise HTTPException(status_code=422, detail="invalid_period")
    if (filters.date_to - filters.date_from).days >= MAX_PERIOD_DAYS:
        raise HTTPException(status_code=422, detail="invalid_period")
    start = datetime.combine(filters.date_from, time.min, tzinfo=zone)
    end = datetime.combine(filters.date_to + timedelta(days=1), time.min, tzinfo=zone)
    return start.astimezone(UTC), end.astimezone(UTC)


def load_rows(db: Session, filters: StatsFilter, zone: ZoneInfo) -> list[AnswerRow]:
    start, end = period_bounds(filters, zone)
    query = (
        select(
            SurveySession.id,
            SurveySession.point_id,
            SurveySession.started_at,
            SurveySession.status,
            SurveyAnswer.question,
            SurveyAnswer.option,
        )
        .join(Point, Point.id == SurveySession.point_id)
        .outerjoin(SurveyAnswer, SurveyAnswer.session_id == SurveySession.id)
        .where(SurveySession.started_at >= start, SurveySession.started_at < end)
    )
    if filters.region:
        query = query.where(Point.region == filters.region)
    if filters.store:
        query = query.where(Point.store == filters.store)
    if filters.point_id is not None:
        query = query.where(Point.id == filters.point_id)
    return [AnswerRow(*row) for row in db.execute(query)]


def group_rows[K: Hashable](rows: list[AnswerRow], key: Callable[[AnswerRow], K]) -> dict[K, Bucket]:
    buckets: dict[K, Bucket] = {}
    for row in rows:
        buckets.setdefault(key(row), Bucket()).add(row)
    return buckets


def build_summary(db: Session, filters: StatsFilter, zone: ZoneInfo) -> SummaryOut:
    bucket = group_rows(load_rows(db, filters, zone), lambda _: None).get(None, Bucket())
    return SummaryOut(
        sessions=len(bucket.sessions),
        completed_sessions=len(bucket.completed),
        completion_rate=bucket.completion_rate,
        consultant=bucket.consultant,
        lost_demand=bucket.lost_demand,
        recommend=bucket.recommend,
        availability={
            option: bucket.metric(Question.AVAILABILITY, frozenset({option}))
            for option in QUESTION_OPTIONS[Question.AVAILABILITY]
        },
    )


def timeline_keys(filters: StatsFilter, granularity: StatsGranularity) -> list[str]:
    if granularity == "hour":
        return [f"{hour:02d}:00" for hour in range(HOURS_IN_DAY)]
    days = (filters.date_to - filters.date_from).days + 1
    return [(filters.date_from + timedelta(days=offset)).isoformat() for offset in range(days)]


def timeline_key(started_at: datetime, granularity: StatsGranularity, zone: ZoneInfo) -> str:
    local = started_at.astimezone(zone)
    return f"{local.hour:02d}:00" if granularity == "hour" else local.date().isoformat()


def build_timeline(db: Session, filters: StatsFilter, granularity: StatsGranularity, zone: ZoneInfo) -> TimelineOut:
    rows = load_rows(db, filters, zone)
    buckets = group_rows(rows, lambda row: timeline_key(row.started_at, granularity, zone))
    items = []
    for key in timeline_keys(filters, granularity):
        bucket = buckets.get(key, Bucket())
        items.append(
            TimelineItem(
                bucket=key,
                sessions=len(bucket.sessions),
                completed_sessions=len(bucket.completed),
                consultant_rate=bucket.consultant.rate,
                lost_demand_rate=bucket.lost_demand.rate,
                recommend_rate=bucket.recommend.rate,
            )
        )
    return TimelineOut(granularity=granularity, items=items)


def build_point_stats(db: Session, filters: StatsFilter, zone: ZoneInfo) -> list[PointStatsItem]:
    buckets = group_rows(load_rows(db, filters, zone), lambda row: row.point_id)
    points = db.scalars(select(Point).where(Point.id.in_(buckets.keys()))).all()
    items = [
        PointStatsItem(
            point_id=point.id,
            region=point.region,
            store=point.store,
            register_number=point.register_number,
            sessions=len(buckets[point.id].sessions),
            completed_sessions=len(buckets[point.id].completed),
            completion_rate=buckets[point.id].completion_rate,
            consultant_rate=buckets[point.id].consultant.rate,
            lost_demand_rate=buckets[point.id].lost_demand.rate,
            recommend_rate=buckets[point.id].recommend.rate,
        )
        for point in points
    ]
    return sorted(items, key=lambda item: (item.region, item.store, item.register_number))
