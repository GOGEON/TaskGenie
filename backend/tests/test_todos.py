from fastapi.testclient import TestClient

from conftest import register_and_login


def _generate(client, headers, keyword="운동"):
    response = client.post("/todos/generate", headers=headers, json={"keyword": keyword})
    assert response.status_code == 200
    return response.json()


def test_generate_builds_nested_tree(client: TestClient, auth_headers):
    todo_list = _generate(client, auth_headers)
    assert todo_list["keyword"] == "운동"
    assert [i["description"] for i in todo_list["items"]] == ["운동 계획", "운동 실행"]
    assert [c["description"] for c in todo_list["items"][0]["children"]] == ["세부 1", "세부 2"]
    assert [c["order"] for c in todo_list["items"][0]["children"]] == [0, 1]


def test_get_lists_only_returns_own(client: TestClient, auth_headers):
    _generate(client, auth_headers)
    other = register_and_login(client, "other")
    assert client.get("/todos", headers=other).json() == []
    assert len(client.get("/todos", headers=auth_headers).json()) == 1


def test_create_item_appends_and_parses_due_date(client: TestClient, auth_headers):
    todo_list = _generate(client, auth_headers)
    response = client.post("/todos/items", headers=auth_headers, json={
        "description": "새 작업",
        "list_id": todo_list["id"],
        "priority": "invalid",
        "due_date": "2030-01-02T15:00:00+09:00",
    })
    assert response.status_code == 200
    item = response.json()
    assert item["order"] == 2
    assert item["priority"] == "none"
    assert item["due_date"].startswith("2030-01-02T15:00:00")


def test_create_child_item_orders_within_parent(client: TestClient, auth_headers):
    todo_list = _generate(client, auth_headers)
    parent = todo_list["items"][0]
    item = client.post("/todos/items", headers=auth_headers, json={
        "description": "세부 3", "list_id": todo_list["id"], "parent_id": parent["id"],
    }).json()
    assert item["order"] == 2
    tree = client.get(f"/todos/{todo_list['id']}", headers=auth_headers).json()["items"]
    assert [c["description"] for c in tree[0]["children"]] == ["세부 1", "세부 2", "세부 3"]


def test_create_item_in_foreign_list_is_404(client: TestClient, auth_headers):
    todo_list = _generate(client, auth_headers)
    other = register_and_login(client, "intruder")
    response = client.post("/todos/items", headers=other, json={"description": "x", "list_id": todo_list["id"]})
    assert response.status_code == 404


def test_generate_subtasks_uses_ancestor_context(client: TestClient, auth_headers):
    todo_list = _generate(client, auth_headers)
    child = todo_list["items"][0]["children"][0]
    response = client.post(f"/todos/items/{child['id']}/generate-subtasks", headers=auth_headers)
    assert response.status_code == 200
    assert [c["description"] for c in response.json()["children"]] == ["운동 계획 > 세부 1 - 하위"]


def test_update_item_and_list(client: TestClient, auth_headers):
    todo_list = _generate(client, auth_headers)
    item_id = todo_list["items"][1]["id"]

    response = client.put(f"/todos/items/{item_id}", headers=auth_headers, json={"is_completed": True})
    assert response.status_code == 200
    assert response.json()["is_completed"] is True

    response = client.put(f"/todos/{todo_list['id']}", headers=auth_headers, json={"keyword": "헬스"})
    assert response.json()["keyword"] == "헬스"

    other = register_and_login(client, "editor")
    assert client.put(f"/todos/items/{item_id}", headers=other, json={"is_completed": False}).status_code == 404


def test_delete_item_removes_descendants(client: TestClient, auth_headers, fake_db):
    todo_list = _generate(client, auth_headers)
    parent_id = todo_list["items"][0]["id"]

    assert client.delete(f"/todos/items/{parent_id}", headers=auth_headers).status_code == 204
    remaining = client.get(f"/todos/{todo_list['id']}", headers=auth_headers).json()["items"]
    assert [i["description"] for i in remaining] == ["운동 실행"]
    assert len(fake_db.data["todo_items"]) == 1


def test_delete_list(client: TestClient, auth_headers, fake_db):
    todo_list = _generate(client, auth_headers)
    assert client.delete(f"/todos/{todo_list['id']}", headers=auth_headers).status_code == 204
    assert fake_db.data["todo_items"] == {}
    assert client.get(f"/todos/{todo_list['id']}", headers=auth_headers).status_code == 404


# ==================== 완료된 부모에 하위 항목 추가 ====================

def _find_item(items, item_id):
    for item in items:
        if item["id"] == item_id:
            return item
        found = _find_item(item["children"], item_id)
        if found:
            return found
    return None


def _create_completed_project(client, headers):
    """루트 "계획" > 하위 "세부 1", 루트 "실행"을 모두 완료 처리한 프로젝트."""
    project = _generate(client, headers)
    root, other_root = project["items"]
    child = root["children"][0]
    for item_id in (root["id"], child["id"], other_root["id"]):
        response = client.put(f"/todos/items/{item_id}", headers=headers, json={"is_completed": True})
        assert response.status_code == 200
    return project["id"], root["id"], child["id"], other_root["id"]


def test_quick_add_child_reopens_completed_ancestors(client: TestClient, auth_headers):
    list_id, root_id, child_id, other_root_id = _create_completed_project(client, auth_headers)

    response = client.post("/todos/items", headers=auth_headers, json={
        "description": "새 작업", "list_id": list_id, "parent_id": child_id,
    })
    assert response.status_code == 200
    new_id = response.json()["id"]
    assert response.json()["is_completed"] is False

    # 새로고침처럼 프로젝트를 다시 조회
    items = client.get(f"/todos/{list_id}", headers=auth_headers).json()["items"]
    assert _find_item(items, root_id)["is_completed"] is False
    assert _find_item(items, child_id)["is_completed"] is False
    assert [c["id"] for c in _find_item(items, child_id)["children"]] == [new_id]
    # 새 작업의 조상이 아닌 항목은 상태 유지
    assert _find_item(items, other_root_id)["is_completed"] is True


def test_generate_subtasks_reopens_completed_ancestors(client: TestClient, auth_headers):
    list_id, root_id, child_id, other_root_id = _create_completed_project(client, auth_headers)

    response = client.post(f"/todos/items/{child_id}/generate-subtasks", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["is_completed"] is False
    assert len(response.json()["children"]) == 1

    items = client.get(f"/todos/{list_id}", headers=auth_headers).json()["items"]
    assert _find_item(items, root_id)["is_completed"] is False
    assert _find_item(items, child_id)["is_completed"] is False
    assert _find_item(items, other_root_id)["is_completed"] is True


def test_quick_add_does_not_reopen_items_in_another_list(client: TestClient, auth_headers):
    list_id, root_id, child_id, _ = _create_completed_project(client, auth_headers)

    other = register_and_login(client, "other")
    other_list_id = _generate(client, other, keyword="공부")["id"]
    client.post("/todos/items", headers=other, json={
        "description": "새 작업", "list_id": other_list_id, "parent_id": child_id,
    })

    items = client.get(f"/todos/{list_id}", headers=auth_headers).json()["items"]
    assert _find_item(items, root_id)["is_completed"] is True
    assert _find_item(items, child_id)["is_completed"] is True
