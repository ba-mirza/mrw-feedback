from enum import StrEnum


class Question(StrEnum):
    CONSULTANT = "consultant"
    AVAILABILITY = "availability"
    NPS = "nps"


class SessionStatus(StrEnum):
    INCOMPLETE = "incomplete"
    COMPLETED = "completed"


QUESTION_OPTIONS: dict[Question, tuple[str, ...]] = {
    Question.CONSULTANT: ("green", "red"),
    Question.AVAILABILITY: ("all", "alternative", "partial", "none"),
    Question.NPS: ("yes", "no"),
}

QUESTION_ORDER: tuple[Question, ...] = (Question.CONSULTANT, Question.AVAILABILITY, Question.NPS)

SATISFIED_CONSULTANT_OPTION = "green"
LOST_DEMAND_OPTIONS = frozenset({"partial", "none"})
RECOMMEND_OPTION = "yes"


def is_valid_option(question: Question, option: str) -> bool:
    return option in QUESTION_OPTIONS[question]
