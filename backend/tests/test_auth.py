from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD


def test_login_returns_token_and_profile(client, admin):
    response = client.post("/v1/auth/login", json={"email": ADMIN_EMAIL.upper(), "password": ADMIN_PASSWORD})
    assert response.status_code == 200
    token = response.json()["access_token"]

    profile = client.get("/v1/admin/me", headers={"Authorization": f"Bearer {token}"})
    assert profile.status_code == 200
    assert profile.json() == {
        "id": admin.id,
        "name": "Админ",
        "email": ADMIN_EMAIL,
        "permissions": ["points", "stats"],
    }


def test_login_rejects_wrong_password(client, admin):
    response = client.post("/v1/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert response.status_code == 401
    assert response.json() == {"code": "invalid_credentials", "message": "Неверная почта или пароль"}


def test_inactive_admin_cannot_use_token(client, db, admin, auth_headers):
    admin.is_active = False
    db.commit()
    assert client.get("/v1/admin/me", headers=auth_headers).status_code == 401


def test_admin_endpoints_require_token(client):
    assert client.get("/v1/admin/points").status_code == 401
    assert client.get("/v1/admin/points", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_validation_errors_use_field_list(client):
    response = client.post("/v1/auth/login", json={"email": "not-an-email", "password": ""})
    assert response.status_code == 422
    assert {issue["field"] for issue in response.json()} == {"email", "password"}
