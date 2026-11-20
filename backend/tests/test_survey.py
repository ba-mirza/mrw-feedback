from datetime import timedelta

from app.models import SurveySession

PHONE_A = {"User-Agent": "phone-a"}
PHONE_B = {"User-Agent": "phone-b"}


DEVICE_A = "11111111-1111-4111-8111-111111111111"
DEVICE_B = "22222222-2222-4222-8222-222222222222"


def start(client, code, headers=PHONE_A, device_id=None):
    body = {"code": code} if device_id is None else {"code": code, "device_id": device_id}
    return client.post("/v1/survey/sessions", json=body, headers=headers)


def answer(client, session_id, question, option):
    return client.post(f"/v1/survey/sessions/{session_id}/answers", json={"question": question, "option": option})


def test_full_survey_completes_session(client, create_point):
    point = create_point(store="ТРЦ Mega")
    session = start(client, point["code"]).json()
    assert session["status"] == "incomplete"
    assert session["point"] == {"store": "ТРЦ Mega"}
    assert session["answers"] == {}

    answer(client, session["id"], "consultant", "green")
    answer(client, session["id"], "availability", "partial")
    final = answer(client, session["id"], "nps", "yes").json()
    assert final["status"] == "completed"
    assert final["answers"] == {"consultant": "green", "availability": "partial", "nps": "yes"}


def test_code_is_case_insensitive(client, create_point):
    point = create_point()
    assert start(client, point["code"].upper()).status_code == 200


def test_unknown_or_inactive_point(client, auth_headers, create_point):
    assert start(client, "nope").status_code == 404
    point = create_point()
    client.put(
        f"/v1/admin/points/{point['id']}",
        json={"region": point["region"], "store": point["store"], "register_number": point["register_number"], "is_active": False},
        headers=auth_headers,
    )
    response = start(client, point["code"])
    assert response.status_code == 404
    assert response.json()["code"] == "point_not_found"


def test_reopening_resumes_incomplete_session(client, create_point):
    point = create_point()
    first = start(client, point["code"]).json()
    answer(client, first["id"], "consultant", "red")

    again = start(client, point["code"]).json()
    assert again["id"] == first["id"]
    assert again["answers"] == {"consultant": "red"}

    other_phone = start(client, point["code"], PHONE_B).json()
    assert other_phone["id"] != first["id"]


def test_stale_incomplete_session_is_not_resumed(client, db, create_point, settings):
    point = create_point()
    first = start(client, point["code"]).json()
    stored = db.get(SurveySession, first["id"])
    stored.started_at -= timedelta(minutes=settings.SESSION_RESUME_MINUTES + 1)
    db.commit()

    assert start(client, point["code"]).json()["id"] != first["id"]
    expired = answer(client, first["id"], "consultant", "green")
    assert expired.status_code == 410
    assert expired.json()["code"] == "session_expired"


def test_repeat_after_completion_is_blocked_within_window(client, db, create_point, settings):
    point = create_point()
    session = start(client, point["code"]).json()
    for question, option in (("consultant", "green"), ("availability", "all"), ("nps", "yes")):
        answer(client, session["id"], question, option)

    blocked = start(client, point["code"])
    assert blocked.status_code == 409
    assert blocked.json()["code"] == "already_completed"
    assert start(client, point["code"], PHONE_B).status_code == 200

    stored = db.get(SurveySession, session["id"])
    stored.started_at -= timedelta(hours=settings.REPEAT_WINDOW_HOURS + 1)
    db.commit()
    assert start(client, point["code"]).status_code == 200


def test_device_id_separates_phones_with_same_network_and_browser(client, create_point):
    point = create_point()
    session = start(client, point["code"], device_id=DEVICE_A).json()
    for question, option in (("consultant", "green"), ("availability", "all"), ("nps", "yes")):
        answer(client, session["id"], question, option)

    assert start(client, point["code"], device_id=DEVICE_A).status_code == 409
    assert start(client, point["code"], device_id=DEVICE_B).status_code == 200


def test_device_id_format_is_validated(client, create_point):
    point = create_point()
    assert start(client, point["code"], device_id="short").status_code == 422
    assert start(client, point["code"], device_id="x" * 20 + "<script>").status_code == 422


def test_answer_validation(client, create_point):
    point = create_point()
    session = start(client, point["code"]).json()

    wrong_option = answer(client, session["id"], "consultant", "yellow")
    assert wrong_option.status_code == 422
    assert wrong_option.json()["code"] == "invalid_option"
    assert answer(client, session["id"], "weather", "sunny").status_code == 422

    assert answer(client, session["id"], "consultant", "green").status_code == 200
    duplicate = answer(client, session["id"], "consultant", "red")
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "already_answered"

    assert answer(client, "missing", "nps", "yes").status_code == 404


def test_completed_session_rejects_more_answers(client, create_point):
    point = create_point()
    session = start(client, point["code"]).json()
    for question, option in (("consultant", "green"), ("availability", "all"), ("nps", "no")):
        answer(client, session["id"], question, option)
    assert answer(client, session["id"], "nps", "yes").json()["code"] == "already_completed"
