"""
테스트 공통 설정.

실제 Firestore 대신 인메모리 FakeFirestore를 싱글톤에 주입하고,
AI 호출은 고정된 응답으로 대체한다.
"""
import os
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.dirname(__file__))

from fake_firestore import FakeFirestore  # noqa: E402
from src import firestore_db  # noqa: E402

firestore_db.db = FakeFirestore()

from src.main import app  # noqa: E402
from src.services import todo_service_firestore as todo_service  # noqa: E402


@pytest.fixture(autouse=True)
def fake_db(monkeypatch):
    """테스트마다 빈 데이터베이스 사용."""
    db = FakeFirestore()
    monkeypatch.setattr(firestore_db, 'db', db)
    return db


@pytest.fixture(autouse=True)
def fake_ai(monkeypatch):
    monkeypatch.setattr(
        todo_service,
        'generate_todo_items_from_keyword',
        lambda keyword: [
            {"description": f"{keyword} 계획", "children": [{"description": "세부 1"}, {"description": "세부 2"}]},
            {"description": f"{keyword} 실행"},
        ],
    )
    monkeypatch.setattr(
        todo_service,
        'generate_sub_tasks_from_main_task',
        lambda main_task_description, project_keyword, context_path: [f"{' > '.join(context_path)} - 하위"],
    )


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def register_and_login(client, username="tester", password="secret-pass"):
    client.post("/auth/register", json={"username": username, "password": password, "email": f"{username}@example.com"})
    response = client.post("/auth/login", data={"username": username, "password": password})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def auth_headers(client):
    return register_and_login(client)
