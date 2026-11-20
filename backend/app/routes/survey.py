from typing import Annotated

from fastapi import APIRouter, Header, Request

from app.deps import AppSettings, DbSession
from app.schemas import AnswerInput, SessionStartInput, SurveySessionOut
from app.services import survey_sessions as service

router = APIRouter(prefix="/v1/survey", tags=["survey"])

UNKNOWN_IP = "unknown"


@router.post("/sessions")
def start_session(
    data: SessionStartInput,
    request: Request,
    db: DbSession,
    settings: AppSettings,
    user_agent: Annotated[str, Header()] = "",
) -> SurveySessionOut:
    ip = request.client.host if request.client else UNKNOWN_IP
    session = service.start_session(db, settings, data.code, data.device_id, ip, user_agent)
    return service.to_session_out(session)


@router.post("/sessions/{session_id}/answers")
def save_answer(session_id: str, data: AnswerInput, db: DbSession, settings: AppSettings) -> SurveySessionOut:
    session = service.save_answer(db, settings, session_id, data.question, data.option)
    return service.to_session_out(session)
