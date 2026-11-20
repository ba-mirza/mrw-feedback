from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import Settings, get_settings
from app.db import Base, get_db
from app.main import create_app
from app.models import Admin
from app.security import hash_password

ADMIN_EMAIL = "admin@marwin.kz"
ADMIN_PASSWORD = "correct-horse-battery"


@pytest.fixture
def settings(tmp_path) -> Settings:
    return Settings(
        DATABASE_URL=f"sqlite:///{tmp_path / 'test.db'}",
        SECRET_KEY="test-secret-key-test-secret-key-0000",
        SURVEY_BASE_URL="https://survey.example/",
        _env_file=None,
    )


@pytest.fixture
def session_factory(settings: Settings) -> Iterator[sessionmaker[Session]]:
    engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine, expire_on_commit=False)
    engine.dispose()


@pytest.fixture
def db(session_factory: sessionmaker[Session]) -> Iterator[Session]:
    with session_factory() as session:
        yield session


@pytest.fixture
def client(settings: Settings, session_factory: sessionmaker[Session]) -> Iterator[TestClient]:
    app = create_app()

    def override_db() -> Iterator[Session]:
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_settings] = lambda: settings
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def admin(db: Session) -> Admin:
    record = Admin(email=ADMIN_EMAIL, name="Админ", password_hash=hash_password(ADMIN_PASSWORD))
    db.add(record)
    db.commit()
    return record


@pytest.fixture
def auth_headers(client: TestClient, admin: Admin) -> dict[str, str]:
    response = client.post("/v1/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def create_point(client: TestClient, auth_headers: dict[str, str]):
    def factory(store: str = "ТРЦ Mega", register_number: str = "1", region: str = "Алматы") -> dict:
        response = client.post(
            "/v1/admin/points",
            json={"region": region, "store": store, "register_number": register_number},
            headers=auth_headers,
        )
        assert response.status_code == 201, response.text
        return response.json()

    return factory
