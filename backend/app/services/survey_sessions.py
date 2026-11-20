from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.config import Settings
from app.models import Point, SurveyAnswer, SurveySession, utc_now
from app.schemas import SurveyPointOut, SurveySessionOut
from app.security import device_fingerprint
from app.survey import QUESTION_ORDER, Question, SessionStatus, is_valid_option

USER_AGENT_LIMIT = 512


def to_session_out(session: SurveySession) -> SurveySessionOut:
    return SurveySessionOut(
        id=session.id,
        status=SessionStatus(session.status),
        point=SurveyPointOut(store=session.point.store),
        answers={Question(answer.question): answer.option for answer in session.answers},
    )


def find_recent_session(
    db: Session, point_id: int, device_hash: str, status: SessionStatus, since: datetime
) -> SurveySession | None:
    query = (
        select(SurveySession)
        .options(selectinload(SurveySession.answers), selectinload(SurveySession.point))
        .where(
            SurveySession.point_id == point_id,
            SurveySession.device_hash == device_hash,
            SurveySession.status == status.value,
            SurveySession.started_at >= since,
        )
        .order_by(SurveySession.started_at.desc())
        .limit(1)
    )
    return db.scalars(query).first()


def start_session(db: Session, settings: Settings, code: str, ip: str, user_agent: str) -> SurveySession:
    point = db.scalars(select(Point).where(Point.code == code.strip().lower())).first()
    if point is None or not point.is_active:
        raise HTTPException(status_code=404, detail="point_not_found")

    now = utc_now()
    device_hash = device_fingerprint(ip, user_agent, settings)
    repeat_since = now - timedelta(hours=settings.REPEAT_WINDOW_HOURS)
    if find_recent_session(db, point.id, device_hash, SessionStatus.COMPLETED, repeat_since):
        raise HTTPException(status_code=409, detail="already_completed")

    resume_since = now - timedelta(minutes=settings.SESSION_RESUME_MINUTES)
    open_session = find_recent_session(db, point.id, device_hash, SessionStatus.INCOMPLETE, resume_since)
    if open_session is not None:
        return open_session

    session = SurveySession(
        point=point,
        device_hash=device_hash,
        user_agent=user_agent[:USER_AGENT_LIMIT],
        started_at=now,
        answers=[],
    )
    db.add(session)
    db.commit()
    return session


def load_session(db: Session, session_id: str) -> SurveySession:
    query = (
        select(SurveySession)
        .options(selectinload(SurveySession.answers), selectinload(SurveySession.point))
        .where(SurveySession.id == session_id)
    )
    session = db.scalars(query).first()
    if session is None:
        raise HTTPException(status_code=404, detail="session_not_found")
    return session


def save_answer(db: Session, settings: Settings, session_id: str, question: Question, option: str) -> SurveySession:
    session = load_session(db, session_id)
    now = utc_now()

    if session.status == SessionStatus.COMPLETED:
        raise HTTPException(status_code=409, detail="already_completed")
    if now - session.started_at > timedelta(minutes=settings.SESSION_RESUME_MINUTES):
        raise HTTPException(status_code=410, detail="session_expired")
    if not is_valid_option(question, option):
        raise HTTPException(status_code=422, detail="invalid_option")
    if any(answer.question == question for answer in session.answers):
        raise HTTPException(status_code=409, detail="already_answered")

    session.answers.append(SurveyAnswer(question=question.value, option=option, answered_at=now))
    answered = {answer.question for answer in session.answers}
    if all(item.value in answered for item in QUESTION_ORDER):
        session.status = SessionStatus.COMPLETED.value
        session.finished_at = now

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="already_answered") from None
    return session
