import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from fastapi.testclient import TestClient

def get_auth_token(client: TestClient, username: str = "testuser_todo"):
    # Register a user first
    client.post(
        "/auth/register",
        json={
            "username": username,
            "password": "testpassword_todo",
            "email": f"{username}@example.com"
        }
    )
    # Login and get token
    response = client.post(
        "/auth/login",
        data={
            "username": username,
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
        f"/todos/items/{item_id}",
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


# ==================== 완료된 부모에 하위 항목 추가 ====================

def _find_item(items, item_id):
    for item in items:
        if item["id"] == item_id:
            return item
        found = _find_item(item["children"], item_id)
        if found:
            return found
    return None


def _create_completed_project(client: TestClient, headers):
    """Project with root "a" > child "a-1" and root "b", all marked complete."""
    project = client.post("/todos/generate", headers=headers, json={"keyword": "a"}).json()
    root, other_root = project["items"]
    child = root["children"][0]
    for item_id in (root["id"], child["id"], other_root["id"]):
        response = client.put(f"/todos/items/{item_id}", headers=headers, json={"is_completed": True})
        assert response.status_code == 200
    return project["id"], root["id"], child["id"], other_root["id"]


def test_quick_add_child_reopens_completed_ancestors(client: TestClient):
    headers = {"Authorization": f"Bearer {get_auth_token(client)}"}
    list_id, root_id, child_id, other_root_id = _create_completed_project(client, headers)

    response = client.post(
        "/todos/items",
        headers=headers,
        json={"description": "new task", "list_id": list_id, "parent_id": child_id},
    )
    assert response.status_code == 200
    new_id = response.json()["id"]
    assert response.json()["is_completed"] is False

    # Re-read the project, as a page reload would
    items = client.get(f"/todos/{list_id}", headers=headers).json()["items"]
    assert _find_item(items, root_id)["is_completed"] is False
    assert _find_item(items, child_id)["is_completed"] is False
    assert [c["id"] for c in _find_item(items, child_id)["children"]] == [new_id]
    # Items outside the new task's ancestor chain keep their state
    assert _find_item(items, other_root_id)["is_completed"] is True


def test_generate_subtasks_reopens_completed_ancestors(client: TestClient):
    headers = {"Authorization": f"Bearer {get_auth_token(client)}"}
    list_id, root_id, child_id, other_root_id = _create_completed_project(client, headers)

    response = client.post(f"/todos/items/{child_id}/generate-subtasks", headers=headers)
    assert response.status_code == 200
    assert response.json()["is_completed"] is False
    assert len(response.json()["children"]) == 2

    items = client.get(f"/todos/{list_id}", headers=headers).json()["items"]
    assert _find_item(items, root_id)["is_completed"] is False
    assert _find_item(items, child_id)["is_completed"] is False
    assert _find_item(items, other_root_id)["is_completed"] is True


def test_quick_add_does_not_reopen_items_in_another_list(client: TestClient):
    owner_headers = {"Authorization": f"Bearer {get_auth_token(client, 'owner')}"}
    list_id, root_id, child_id, _ = _create_completed_project(client, owner_headers)

    other_headers = {"Authorization": f"Bearer {get_auth_token(client, 'other')}"}
    other_list_id = client.post("/todos/generate", headers=other_headers, json={"keyword": "b"}).json()["id"]
    client.post(
        "/todos/items",
        headers=other_headers,
        json={"description": "new task", "list_id": other_list_id, "parent_id": child_id},
    )

    items = client.get(f"/todos/{list_id}", headers=owner_headers).json()["items"]
    assert _find_item(items, root_id)["is_completed"] is True
    assert _find_item(items, child_id)["is_completed"] is True
