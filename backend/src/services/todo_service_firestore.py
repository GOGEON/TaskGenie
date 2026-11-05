"""
할 일 서비스 모듈 (Firestore)

할 일(Todo) 관련 비즈니스 로직을 담당.

주요 기능:
- 프로젝트(Todo List) CRUD
- 할 일 아이템(Todo Item) CRUD
- AI 기반 할 일 자동 생성
- 계층적(트리) 구조 관리
- 자연어 파싱 기반 아이템 생성

Firestore 컬렉션:
- todo_lists: 프로젝트 (user_id로 소유자 식별)
- todo_items: 아이템 (todo_list_id, parent_id로 평면 저장 → 조회 시 트리로 재구성)
"""
from collections import deque
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional
from zoneinfo import ZoneInfo
import uuid

from google.cloud import firestore

from ..firestore_db import get_firestore_db
from ..schemas import ToDoItemUpdate, ToDoListUpdate
from ..services.ai_service import generate_todo_items_from_keyword, generate_sub_tasks_from_main_task


LISTS = 'todo_lists'
ITEMS = 'todo_items'
KST = ZoneInfo("Asia/Seoul")
VALID_PRIORITIES = {"high", "medium", "low", "none"}


# ==================== 내부 헬퍼 ====================

def _now() -> datetime:
    """현재 시각 (UTC, timezone-aware)."""
    return datetime.now(timezone.utc)


def _doc_to_dict(doc) -> Dict[str, Any]:
    """Firestore 문서 스냅샷을 id가 포함된 dict로 변환."""
    data = doc.to_dict()
    data['id'] = doc.id
    return data


def _parse_kst_datetime(value: Any) -> Optional[datetime]:
    """
    ISO 형식 문자열을 KST 기준 datetime으로 변환.

    시간대 정보가 없는 문자열은 한국 시간으로 간주한다.
    파싱할 수 없는 값은 None을 반환한다.
    """
    if not value or not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=KST)


def _get_owned_list(db: firestore.Client, list_id: str, user: Any):
    """사용자 소유 프로젝트 문서 스냅샷 반환 (없거나 권한 없으면 None)."""
    doc = db.collection(LISTS).document(list_id).get()
    if not doc.exists or doc.to_dict().get('user_id') != user.id:
        return None
    return doc


def _get_owned_item(db: firestore.Client, item_id: str, user: Any):
    """사용자 소유 프로젝트에 속한 아이템 문서 스냅샷 반환 (없거나 권한 없으면 None)."""
    doc = db.collection(ITEMS).document(item_id).get()
    if not doc.exists:
        return None
    if not _get_owned_list(db, doc.to_dict()['todo_list_id'], user):
        return None
    return doc


def _new_item_doc(
    todo_list_id: str,
    description: str,
    order: int,
    parent_id: Optional[str] = None,
    priority: str = "none",
    due_date: Optional[datetime] = None,
) -> Dict[str, Any]:
    """새 아이템 문서 데이터 생성."""
    now = _now()
    return {
        "id": str(uuid.uuid4()),
        "todo_list_id": todo_list_id,
        "parent_id": parent_id,
        "description": description,
        "is_completed": False,
        "order": order,
        "priority": priority if priority in VALID_PRIORITIES else "none",
        "due_date": due_date,
        "reminder_date": None,
        "created_at": now,
        "updated_at": now,
    }


def _save_item(db: firestore.Client, item_doc: Dict[str, Any]) -> None:
    db.collection(ITEMS).document(item_doc['id']).set(item_doc)


def _build_item_tree(all_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    플랫 데이터를 parent_id 기준 트리 구조로 변환.

    - 각 단계는 order 필드 기준으로 정렬
    - 아직 서버에서 확정되지 않은 SERVER_TIMESTAMP 값은 현재 시간으로 대체

    Returns:
        루트 아이템 목록 (각 아이템에 children 필드 포함)
    """
    server_timestamp_type = type(firestore.SERVER_TIMESTAMP)
    items_by_id = {}
    for item in all_items:
        for key, value in item.items():
            if isinstance(value, server_timestamp_type):
                item[key] = _now()
        item['children'] = []
        items_by_id[item['id']] = item

    root_items = []
    for item in all_items:
        parent_id = item.get('parent_id')
        if not parent_id:
            root_items.append(item)
        elif parent_id in items_by_id:
            items_by_id[parent_id]['children'].append(item)

    by_order = lambda x: x.get('order', 0)
    for item in all_items:
        item['children'].sort(key=by_order)
    root_items.sort(key=by_order)
    return root_items


def _fetch_list_tree(db: firestore.Client, list_id: str) -> List[Dict[str, Any]]:
    """프로젝트의 모든 아이템을 한 번에 조회하여 트리로 반환."""
    docs = db.collection(ITEMS).where('todo_list_id', '==', list_id).stream()
    return _build_item_tree([_doc_to_dict(doc) for doc in docs])


def _find_in_tree(items: Iterable[Dict[str, Any]], target_id: str) -> Optional[Dict[str, Any]]:
    for item in items:
        if item['id'] == target_id:
            return item
        found = _find_in_tree(item['children'], target_id)
        if found:
            return found
    return None


def _next_order(db: firestore.Client, list_id: str, parent_id: Optional[str]) -> int:
    """같은 부모 아래 마지막 순서 (새 아이템을 맨 뒤에 추가)."""
    query = db.collection(ITEMS).where('todo_list_id', '==', list_id).where('parent_id', '==', parent_id)
    return sum(1 for _ in query.stream())


def _create_items_recursively(
    db: firestore.Client,
    items_data: List[Dict[str, Any]],
    todo_list_id: str,
    parent_id: Optional[str] = None,
) -> None:
    """AI가 생성한 중첩 아이템 데이터를 재귀적으로 저장."""
    for order, item_data in enumerate(items_data):
        item_doc = _new_item_doc(todo_list_id, item_data["description"], order, parent_id)
        _save_item(db, item_doc)
        if item_data.get("children"):
            _create_items_recursively(db, item_data["children"], todo_list_id, item_doc['id'])


def _ancestor_path(db: firestore.Client, item: Dict[str, Any]) -> List[str]:
    """루트부터 해당 아이템까지의 description 경로 (AI 컨텍스트용)."""
    path = deque([item['description']])
    parent_id = item.get('parent_id')
    while parent_id:
        parent_doc = db.collection(ITEMS).document(parent_id).get()
        if not parent_doc.exists:
            break
        parent = parent_doc.to_dict()
        path.appendleft(parent['description'])
        parent_id = parent.get('parent_id')
    return list(path)


def _reopen_completed_ancestors(db: firestore.Client, parent_id: Optional[str], todo_list_id: str) -> None:
    """
    새 하위 항목이 추가된 부모와 그 조상들의 완료 상태 해제.

    미완료 하위 항목이 생긴 부모는 더 이상 완료 상태일 수 없으므로,
    parent_id를 따라 루트까지 올라가며 완료된 항목을 한 번의 batch로 미완료 처리한다.
    다른 프로젝트의 항목을 만나면 중단하여 남의 항목을 수정하지 않는다.

    Args:
        parent_id: 새 항목의 부모 ID (None이면 아무것도 하지 않음)
        todo_list_id: 새 항목의 프로젝트 ID
    """
    batch = db.batch()
    has_updates = False
    visited = set()
    current_id = parent_id
    while current_id and current_id not in visited:
        visited.add(current_id)
        doc_ref = db.collection(ITEMS).document(current_id)
        doc = doc_ref.get()
        if not doc.exists:
            break
        data = doc.to_dict()
        if data.get('todo_list_id') != todo_list_id:
            break
        if data.get('is_completed'):
            batch.update(doc_ref, {"is_completed": False, "updated_at": _now()})
            has_updates = True
        current_id = data.get('parent_id')
    if has_updates:
        batch.commit()


# ==================== 생성 ====================

def create_todo_list_with_ai_items(user: Any, keyword: str) -> Dict[str, Any]:
    """AI로 할 일 항목을 생성하여 새 프로젝트 생성."""
    db = get_firestore_db()
    list_id = str(uuid.uuid4())
    now = _now()
    db.collection(LISTS).document(list_id).set({
        "id": list_id,
        "user_id": user.id,
        "keyword": keyword,
        "color": "#3b82f6",
        "icon": "📋",
        "created_at": now,
        "updated_at": now,
    })
    _create_items_recursively(db, generate_todo_items_from_keyword(keyword), list_id)
    return get_todo_list_by_id(list_id, user)


def create_subtasks_for_item(user: Any, parent_item_id: str) -> Optional[Dict[str, Any]]:
    """
    AI로 특정 아이템의 하위 작업 생성.

    Returns:
        하위 작업이 포함된 부모 아이템 (없거나 권한 없으면 None)
    """
    db = get_firestore_db()
    parent_doc = _get_owned_item(db, parent_item_id, user)
    if not parent_doc:
        return None
    parent_item = _doc_to_dict(parent_doc)
    list_id = parent_item['todo_list_id']
    todo_list = db.collection(LISTS).document(list_id).get().to_dict()

    sub_task_descriptions = generate_sub_tasks_from_main_task(
        main_task_description=parent_item['description'],
        project_keyword=todo_list['keyword'],
        context_path=_ancestor_path(db, parent_item),
    )
    for order, description in enumerate(sub_task_descriptions):
        _save_item(db, _new_item_doc(list_id, description, order, parent_item_id))
    if sub_task_descriptions:
        _reopen_completed_ancestors(db, parent_item_id, list_id)

    return get_todo_item_by_id(parent_item_id)


def create_todo_item(
    user: Any,
    list_id: str,
    description: str,
    priority: str = "none",
    due_date: Optional[str] = None,
    parent_id: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    아이템 하나를 같은 부모의 마지막 순서로 생성.

    Args:
        due_date: ISO 형식 문자열 (시간대가 없으면 KST로 간주)

    Returns:
        생성된 아이템 (프로젝트가 없거나 권한 없으면 None)
    """
    db = get_firestore_db()
    if not _get_owned_list(db, list_id, user):
        return None

    item_doc = _new_item_doc(
        list_id,
        description,
        order=_next_order(db, list_id, parent_id),
        parent_id=parent_id,
        priority=priority,
        due_date=_parse_kst_datetime(due_date),
    )
    _save_item(db, item_doc)
    # 완료된 부모 아래에 작업이 추가되면 부모와 조상들의 완료 상태 해제
    _reopen_completed_ancestors(db, parent_id, list_id)
    return get_todo_item_by_id(item_doc['id'])


def create_todo_item_from_parsed_data(user: Any, list_id: str, parsed_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """자연어 파싱 결과로 루트 아이템 생성."""
    return create_todo_item(
        user,
        list_id,
        description=parsed_data.get("description", "New Task"),
        priority=parsed_data.get("priority", "none"),
        due_date=parsed_data.get("due_date"),
    )


# ==================== 조회 ====================

def get_todo_lists_by_user(user: Any) -> List[Dict[str, Any]]:
    """사용자의 모든 프로젝트 (각각 아이템 트리 포함)."""
    db = get_firestore_db()
    lists = []
    for doc in db.collection(LISTS).where('user_id', '==', user.id).stream():
        list_data = _doc_to_dict(doc)
        list_data['items'] = _fetch_list_tree(db, doc.id)
        lists.append(list_data)
    return lists


def get_todo_list_by_id(list_id: str, user: Any) -> Optional[Dict[str, Any]]:
    """특정 프로젝트 (아이템 트리 포함, 없거나 권한 없으면 None)."""
    db = get_firestore_db()
    doc = _get_owned_list(db, list_id, user)
    if not doc:
        return None
    list_data = _doc_to_dict(doc)
    list_data['items'] = _fetch_list_tree(db, list_id)
    return list_data


def get_todo_item_by_id(item_id: str) -> Optional[Dict[str, Any]]:
    """특정 아이템과 그 하위 트리."""
    db = get_firestore_db()
    doc = db.collection(ITEMS).document(item_id).get()
    if not doc.exists:
        return None
    item_data = _doc_to_dict(doc)
    found = _find_in_tree(_fetch_list_tree(db, item_data['todo_list_id']), item_id)
    item_data['children'] = found['children'] if found else []
    return item_data


# ==================== 수정 ====================

def update_todo_list(list_id: str, user: Any, list_update: ToDoListUpdate) -> Optional[Dict[str, Any]]:
    """프로젝트 정보 수정."""
    db = get_firestore_db()
    doc = _get_owned_list(db, list_id, user)
    if not doc:
        return None
    doc.reference.update({**list_update.model_dump(exclude_unset=True), 'updated_at': _now()})
    return get_todo_list_by_id(list_id, user)


def update_todo_item(item_id: str, user: Any, item_update: ToDoItemUpdate) -> Optional[Dict[str, Any]]:
    """
    아이템 수정.

    전체 트리를 다시 빌드하지 않고 수정된 단일 문서만 반환한다 (children은 빈 배열).
    """
    db = get_firestore_db()
    doc = _get_owned_item(db, item_id, user)
    if not doc:
        return None
    doc.reference.update({**item_update.model_dump(exclude_unset=True), 'updated_at': _now()})

    updated_doc = doc.reference.get()
    if not updated_doc.exists:
        return None
    return {**_doc_to_dict(updated_doc), 'children': []}


# ==================== 삭제 ====================

def delete_todo_item(item_id: str, user: Any) -> bool:
    """아이템과 모든 하위 아이템 삭제."""
    db = get_firestore_db()
    if not _get_owned_item(db, item_id, user):
        return False

    # BFS로 삭제할 모든 하위 항목 ID 수집
    ids_to_delete = [item_id]
    queue = deque([item_id])
    while queue:
        parent_id = queue.popleft()
        for child in db.collection(ITEMS).where('parent_id', '==', parent_id).stream():
            ids_to_delete.append(child.id)
            queue.append(child.id)

    batch = db.batch()
    for doc_id in ids_to_delete:
        batch.delete(db.collection(ITEMS).document(doc_id))
    batch.commit()
    return True


def delete_todo_list(list_id: str, user: Any) -> bool:
    """프로젝트와 소속된 모든 아이템 삭제."""
    db = get_firestore_db()
    list_doc = _get_owned_list(db, list_id, user)
    if not list_doc:
        return False

    batch = db.batch()
    for item in db.collection(ITEMS).where('todo_list_id', '==', list_id).stream():
        batch.delete(item.reference)
    batch.delete(list_doc.reference)
    batch.commit()
    return True
