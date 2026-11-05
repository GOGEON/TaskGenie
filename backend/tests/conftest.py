import os
import sys

import pytest
from fastapi.testclient import TestClient

# Add the backend directory to the Python path so `src` is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.dirname(__file__))

# The app reads USE_FIRESTORE at import time; run it against an in-memory Firestore
os.environ["USE_FIRESTORE"] = "true"

from fake_firestore import FakeFirestore  # noqa: E402
from src import firestore_db  # noqa: E402

firestore_db.initialize_firestore = lambda: firestore_db.get_firestore_db()
firestore_db.db = FakeFirestore()

from src.main import app  # noqa: E402
from src.services import todo_service_firestore  # noqa: E402


@pytest.fixture(autouse=True)
def fake_db():
    """Give every test a fresh, empty in-memory Firestore."""
    db = FakeFirestore()
    firestore_db.db = db
    yield db


@pytest.fixture(autouse=True)
def fake_ai(monkeypatch):
    """Replace the Gemini calls with deterministic output."""
    monkeypatch.setattr(
        todo_service_firestore,
        "generate_todo_items_from_keyword",
        lambda keyword: [
            {"description": f"{keyword} 1", "children": [{"description": f"{keyword} 1-1"}]},
            {"description": f"{keyword} 2"},
        ],
    )
    monkeypatch.setattr(
        todo_service_firestore,
        "generate_sub_tasks_from_main_task",
        lambda main_task_description, project_keyword, context_path: [
            f"{main_task_description} - 하위 1",
            f"{main_task_description} - 하위 2",
        ],
    )


@pytest.fixture
def client():
    """
    Test client for the FastAPI application.
    """
    with TestClient(app) as c:
        yield c
