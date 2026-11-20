from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.engine import Dialect
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator

from app.db import Base
from app.survey import SessionStatus


def utc_now() -> datetime:
    return datetime.now(UTC)


class UtcDateTime(TypeDecorator[datetime]):
    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("naive datetime is not allowed")
        return value.astimezone(UTC)

    def process_result_value(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(UtcDateTime, default=utc_now)


class Point(Base):
    __tablename__ = "points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True)
    region: Mapped[str] = mapped_column(String(120))
    store: Mapped[str] = mapped_column(String(255))
    register_number: Mapped[str] = mapped_column(String(64))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(UtcDateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(UtcDateTime, default=utc_now, onupdate=utc_now)

    __table_args__ = (UniqueConstraint("store", "register_number", name="uq_points_store_register"),)


class SurveySession(Base):
    __tablename__ = "survey_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    point_id: Mapped[int] = mapped_column(ForeignKey("points.id", ondelete="RESTRICT"))
    status: Mapped[str] = mapped_column(String(16), default=SessionStatus.INCOMPLETE.value)
    device_hash: Mapped[str] = mapped_column(String(64))
    user_agent: Mapped[str] = mapped_column(String(512), default="")
    started_at: Mapped[datetime] = mapped_column(UtcDateTime, default=utc_now)
    finished_at: Mapped[datetime | None] = mapped_column(UtcDateTime, nullable=True)

    point: Mapped[Point] = relationship()
    answers: Mapped[list["SurveyAnswer"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="SurveyAnswer.answered_at"
    )

    __table_args__ = (
        Index("ix_survey_sessions_started_at", "started_at"),
        Index("ix_survey_sessions_point_device", "point_id", "device_hash", "started_at"),
    )


class SurveyAnswer(Base):
    __tablename__ = "survey_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("survey_sessions.id", ondelete="CASCADE"))
    question: Mapped[str] = mapped_column(String(32))
    option: Mapped[str] = mapped_column(String(32))
    answered_at: Mapped[datetime] = mapped_column(UtcDateTime, default=utc_now)

    session: Mapped[SurveySession] = relationship(back_populates="answers")

    __table_args__ = (UniqueConstraint("session_id", "question", name="uq_survey_answers_session_question"),)
