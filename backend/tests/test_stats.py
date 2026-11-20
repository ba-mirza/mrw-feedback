from datetime import UTC, datetime

import pytest

from app.models import Point, SurveyAnswer, SurveySession

DAY = "2026-11-18"
NEXT_DAY = "2026-11-19"


def at(value: str) -> datetime:
    return datetime.fromisoformat(value).astimezone(UTC)


def add_session(db, point: Point, started: str, answers: dict[str, str], device: str) -> None:
    started_at = at(started)
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
    mega = Point(code="mega1", region="Алматы", store="Mega", register_number="1")
    keruen = Point(code="keruen1", region="Астана", store="Keruen", register_number="1")
    db.add_all([mega, keruen])
    db.flush()
    add_session(db, mega, f"{DAY}T10:15:00+05:00", {"consultant": "green", "availability": "all", "nps": "yes"}, "a")
    add_session(db, mega, f"{DAY}T10:40:00+05:00", {"consultant": "red", "availability": "none", "nps": "no"}, "b")
    add_session(db, mega, f"{DAY}T18:05:00+05:00", {"consultant": "green"}, "c")
    add_session(db, keruen, f"{NEXT_DAY}T00:30:00+05:00", {"consultant": "green", "availability": "partial", "nps": "yes"}, "d")
    add_session(db, keruen, f"{NEXT_DAY}T09:00:00+05:00", {}, "e")
    add_session(db, mega, "2026-11-17T23:59:00+05:00", {"consultant": "red"}, "f")
    db.commit()
    return {"mega": mega, "keruen": keruen}


def get(client, auth_headers, path, **params):
    query = {"date_from": DAY, "date_to": NEXT_DAY, **params}
    response = client.get(f"/v1/admin/stats/{path}", params=query, headers=auth_headers)
    assert response.status_code == 200, response.text
    return response.json()


def test_summary_counts_network(client, auth_headers, seeded):
    body = get(client, auth_headers, "summary")
    assert (body["sessions"], body["completed_sessions"], body["completion_rate"]) == (5, 3, 0.6)
    assert body["consultant"] == {"total": 4, "hits": 3, "rate": 0.75}
    assert body["lost_demand"] == {"total": 3, "hits": 2, "rate": 0.6667}
    assert body["recommend"] == {"total": 3, "hits": 2, "rate": 0.6667}
    assert {option: metric["hits"] for option, metric in body["availability"].items()} == {
        "all": 1,
        "alternative": 0,
        "partial": 1,
        "none": 1,
    }


def test_summary_filters(client, auth_headers, seeded):
    by_region = get(client, auth_headers, "summary", region="Астана")
    assert by_region["sessions"] == 2
    assert by_region["consultant"]["rate"] == 1.0

    by_point = get(client, auth_headers, "summary", point_id=seeded["mega"].id, date_to=DAY)
    assert by_point["sessions"] == 3
    assert by_point["recommend"] == {"total": 2, "hits": 1, "rate": 0.5}


def test_empty_period_has_null_rates(client, auth_headers, seeded):
    body = get(client, auth_headers, "summary", date_from="2026-01-01", date_to="2026-01-01")
    assert body["sessions"] == 0
    assert body["completion_rate"] is None
    assert body["consultant"] == {"total": 0, "hits": 0, "rate": None}


def test_timeline_by_day_uses_local_dates(client, auth_headers, seeded):
    items = get(client, auth_headers, "timeline", granularity="day")["items"]
    assert [(item["bucket"], item["sessions"]) for item in items] == [(DAY, 3), (NEXT_DAY, 2)]


def test_timeline_by_hour_covers_all_hours(client, auth_headers, seeded):
    items = get(client, auth_headers, "timeline", granularity="hour")["items"]
    assert len(items) == 24
    by_hour = {item["bucket"]: item for item in items}
    assert by_hour["10:00"]["sessions"] == 2
    assert by_hour["10:00"]["consultant_rate"] == 0.5
    assert by_hour["00:00"]["sessions"] == 1
    assert by_hour["03:00"]["consultant_rate"] is None


def test_point_comparison(client, auth_headers, seeded):
    items = get(client, auth_headers, "points")["items"]
    assert [(item["store"], item["sessions"], item["recommend_rate"]) for item in items] == [
        ("Mega", 3, 0.5),
        ("Keruen", 2, 1.0),
    ]


def test_invalid_period(client, auth_headers, seeded):
    response = client.get(
        "/v1/admin/stats/summary",
        params={"date_from": NEXT_DAY, "date_to": DAY},
        headers=auth_headers,
    )
    assert response.status_code == 422
    assert response.json()["code"] == "invalid_period"
