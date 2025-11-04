import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from fastapi.testclient import TestClient

def get_auth_token(client: TestClient):
    # Register a user first
    client.post(
        "/auth/register",
        json={
            "username": "testuser_todo",
            "password": "testpassword_todo",
            "email": "todo@example.com"
        }
    )
    # Login and get token
    response = client.post(
        "/auth/login",
        data={
            "username": "testuser_todo",
            "password": "testpassword_todo"
        }
    )
    return response.json()["access_token"]


def test_generate_todo_list(client: TestClient):
    token = get_auth_token(client)
    response = client.post(
        "/todos/generate",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "keyword": "exercise"
        }
    )
    assert response.status_code == 200
    assert "id" in response.json()
    assert response.json()["keyword"] == "exercise"
    assert len(response.json()["items"]) > 0

def test_get_all_todo_lists(client: TestClient):
    token = get_auth_token(client)
    # Create a todo list first
    client.post(
        "/todos/generate",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "keyword": "test"
        }
    )
    response = client.get(
        "/todos",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) > 0

def test_get_single_todo_list(client: TestClient):
    token = get_auth_token(client)
    # First generate a list
    generate_response = client.post(
        "/todos/generate",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "keyword": "study"
        }
    )
    list_id = generate_response.json()["id"]

    response = client.get(
        f"/todos/{list_id}",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    assert response.status_code == 200
    assert response.json()["id"] == list_id
    assert response.json()["keyword"] == "study"

def test_update_todo_item_status(client: TestClient):
    token = get_auth_token(client)
    # First generate a list
    generate_response = client.post(
        "/todos/generate",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "keyword": "work"
        }
    )
    list_id = generate_response.json()["id"]
    item_id = generate_response.json()["items"][0]["id"]

    response = client.put(
        f"/todos/{list_id}/items/{item_id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "is_completed": True
        }
    )
    assert response.status_code == 200
    assert response.json()["id"] == item_id
    assert response.json()["is_completed"]