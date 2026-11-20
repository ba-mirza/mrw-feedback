from datetime import UTC, datetime

import pytest

from app.models import Point, SurveyAnswer, SurveySession

DAY = "2026-11-18"
NEXT_DAY = "2026-11-19"


def add_session(db, point: Point, started: str, answers: dict[str, str], device: str) -> None:
    started_at = datetime.fromisoformat(started).astimezone(UTC)
    complete = len(answers) == 3
    db.add(
        SurveySession(
            point_id=point.id,
            device_hash=device,
            started_at=started_at,
            status="completed" if complete else "incomplete",
            finished_at=started_at if complete else None,
            answers=[SurveyAnswer(question=q, option=o, answered_at=started_at) for q, o in answers.items()],
        )
    )


@pytest.fixture
def seeded(db):
    mega1 = Point(code="mega1", region="Алматы", store="Mega", register_number="1")
    mega2 = Point(code="mega2", region="Алматы", store="Mega", register_number="2")
    keruen = Point(code="keruen1", region="Астана", store="Keruen", register_number="1")
    db.add_all([mega1, mega2, keruen])
    db.flush()
    add_session(db, mega1, f"{DAY}T10:15:00+05:00", {"consultant": "green", "availability": "all", "nps": "yes"}, "a")
    add_session(db, mega1, f"{DAY}T10:40:00+05:00", {"consultant": "red", "availability": "none", "nps": "no"}, "b")
    add_session(db, mega2, f"{DAY}T18:05:00+05:00", {"consultant": "green"}, "c")
    add_session(db, keruen, f"{NEXT_DAY}T00:30:00+05:00", {"consultant": "green", "availability": "partial", "nps": "yes"}, "d")
    add_session(db, keruen, f"{NEXT_DAY}T09:00:00+05:00", {}, "e")
    db.commit()
    return {"mega1": mega1, "mega2": mega2, "keruen": keruen}


def get_stats(client, auth_headers, **params):
    response = client.get("/v1/admin/stats/questions", params=params, headers=auth_headers)
    assert response.status_code == 200, response.text
    return response.json()


def options_of(body, question):
    block = next(item for item in body["questions"] if item["question"] == question)
    return block["total"], {item["option"]: (item["count"], item["rate"]) for item in block["options"]}


def test_all_time_shares_per_question(client, auth_headers, seeded):
    body = get_stats(client, auth_headers)
    assert (body["sessions"], body["completed_sessions"]) == (5, 3)
    assert [item["question"] for item in body["questions"]] == ["consultant", "availability", "nps"]
    assert options_of(body, "consultant") == (4, {"green": (3, 0.75), "red": (1, 0.25)})
    assert options_of(body, "availability") == (
        3,
        {"all": (1, 0.3333), "alternative": (0, 0.0), "partial": (1, 0.3333), "none": (1, 0.3333)},
    )
    assert options_of(body, "nps") == (3, {"yes": (2, 0.6667), "no": (1, 0.3333)})


def test_filters_by_city_store_and_register(client, auth_headers, seeded):
    assert get_stats(client, auth_headers, region="Астана")["sessions"] == 2
    assert get_stats(client, auth_headers, store="Mega")["sessions"] == 3
    by_register = get_stats(client, auth_headers, point_id=seeded["mega2"].id)
    assert by_register["sessions"] == 1
    assert options_of(by_register, "consultant") == (1, {"green": (1, 1.0), "red": (0, 0.0)})


def test_period_uses_local_dates(client, auth_headers, seeded):
    assert get_stats(client, auth_headers, date_from=DAY, date_to=DAY)["sessions"] == 3
    assert get_stats(client, auth_headers, date_from=NEXT_DAY)["sessions"] == 2
    assert get_stats(client, auth_headers, date_to=DAY)["sessions"] == 3


def test_empty_selection_has_null_rates(client, auth_headers, seeded):
    body = get_stats(client, auth_headers, region="Шымкент")
    assert body["sessions"] == 0
    assert options_of(body, "nps") == (0, {"yes": (0, None), "no": (0, None)})


def test_invalid_period(client, auth_headers, seeded):
    response = client.get(
        "/v1/admin/stats/questions", params={"date_from": NEXT_DAY, "date_to": DAY}, headers=auth_headers
    )
    assert response.status_code == 422
    assert response.json()["code"] == "invalid_period"
