from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.survey import Question, SessionStatus

ADMIN_PERMISSIONS = ["points", "stats"]


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


class AuthTokens(BaseModel):
    access_token: str
    expires_in: int


class AdminProfile(BaseModel):
    id: int
    name: str
    email: str
    permissions: list[str] = ADMIN_PERMISSIONS


class PointInput(BaseModel):
    region: str = Field(min_length=1, max_length=120)
    store: str = Field(min_length=1, max_length=255)
    register_number: str = Field(min_length=1, max_length=64)
    is_active: bool = True

    @field_validator("region", "store", "register_number", mode="before")
    @classmethod
    def strip_text(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value


class PointOut(BaseModel):
    id: int
    code: str
    region: str
    store: str
    register_number: str
    is_active: bool
    survey_url: str
    created_at: datetime
    updated_at: datetime


class PointList(BaseModel):
    items: list[PointOut]


class SessionStartInput(BaseModel):
    code: str = Field(min_length=1, max_length=32)


class SurveyPointOut(BaseModel):
    store: str


class SurveySessionOut(BaseModel):
    id: str
    status: SessionStatus
    point: SurveyPointOut
    answers: dict[Question, str]


class AnswerInput(BaseModel):
    question: Question
    option: str = Field(min_length=1, max_length=32)


StatsGranularity = Literal["hour", "day"]


class StatsFilter(BaseModel):
    date_from: date
    date_to: date
    region: str | None = None
    store: str | None = None
    point_id: int | None = None


class RateMetric(BaseModel):
    total: int
    hits: int
    rate: float | None


class SummaryOut(BaseModel):
    sessions: int
    completed_sessions: int
    completion_rate: float | None
    consultant: RateMetric
    lost_demand: RateMetric
    recommend: RateMetric
    availability: dict[str, RateMetric]


class TimelineItem(BaseModel):
    bucket: str
    sessions: int
    completed_sessions: int
    consultant_rate: float | None
    lost_demand_rate: float | None
    recommend_rate: float | None


class TimelineOut(BaseModel):
    granularity: StatsGranularity
    items: list[TimelineItem]


class PointStatsItem(BaseModel):
    point_id: int
    region: str
    store: str
    register_number: str
    sessions: int
    completed_sessions: int
    completion_rate: float | None
    consultant_rate: float | None
    lost_demand_rate: float | None
    recommend_rate: float | None


class PointStatsOut(BaseModel):
    items: list[PointStatsItem]
