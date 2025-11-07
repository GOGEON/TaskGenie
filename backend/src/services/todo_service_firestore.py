"""
Firestore를 사용한 Todo Service
"""
from typing import List, Dict, Any
import uuid
from datetime import datetime
from google.cloud import firestore

from ..firestore_db import get_firestore_db
from ..schemas import ToDoItemUpdate, ToDoListUpdate
from ..services.ai_service import generate_todo_items_from_keyword, generate_sub_tasks_from_main_task

def _build_item_tree(all_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    모든 아이템 목록을 받아 메모리에서 트리 구조를 구축합니다.
    """
    items_by_id = {}
    # Firestore 타임스탬프를 datetime 객체로 변환하고 children 리스트를 초기화합니다.
    for item in all_items:
        for key, value in item.items():
            if isinstance(value, firestore.SERVER_TIMESTAMP.__class__):
                item[key] = datetime.utcnow() # 근사치로 변환
            elif isinstance(value, datetime):
                pass # 이미 datetime 객체
        item['children'] = []
        items_by_id[item['id']] = item

    root_items = []
    for item in all_items:
        parent_id = item.get('parent_id')
        if parent_id:
            parent = items_by_id.get(parent_id)
            if parent:
                parent['children'].append(item)
        else:
            root_items.append(item)

    # 각 레벨에서 order 키를 기준으로 정렬합니다.
    for item in all_items:
        item['children'].sort(key=lambda x: x.get('order', 0))
    root_items.sort(key=lambda x: x.get('order', 0))

    return root_items

def _fetch_and_build_tree_for_list(list_id: str) -> List[Dict[str, Any]]:
    """
    특정 리스트의 모든 아이템을 한 번에 가져와 트리 구조를 만듭니다.
    """
    db = get_firestore_db()
    items_ref = db.collection('todo_items').where('todo_list_id', '==', list_id).stream()
    
    all_items = []
    for item_doc in items_ref:
        item_data = item_doc.to_dict()
        item_data['id'] = item_doc.id
        all_items.append(item_data)
        
    return _build_item_tree(all_items)

def _create_items_recursively(db: firestore.Client, items_data: List[Dict[str, Any]], todo_list_id: str, parent_id: str = None):
    """
    재귀적으로 ToDo 아이템 생성
    """
    for order, item_data in enumerate(items_data):
        item_id = str(uuid.uuid4())
        item_doc = {
            "id": item_id,
            "todo_list_id": todo_list_id,
            "parent_id": parent_id,
            "description": item_data["description"],
            "is_completed": False,
            "order": order,
            "priority": "none",
            "due_date": None,
            "reminder_date": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        db.collection('todo_items').document(item_id).set(item_doc)
        
        if "children" in item_data and item_data["children"]:
            _create_items_recursively(db, item_data["children"], todo_list_id, item_id)


def create_todo_list_with_ai_items(user: Any, keyword: str) -> Dict[str, Any]:
    """
    AI를 사용하여 새로운 Todo 리스트 생성
    """
    db = get_firestore_db()
    
    list_id = str(uuid.uuid4())
    todo_list = {
        "id": list_id,
        "user_id": user.id,
        "keyword": keyword,
        "color": "#3b82f6",
        "icon": "📋",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    db.collection('todo_lists').document(list_id).set(todo_list)
    
    # AI로 아이템 생성
    generated_items_json = generate_todo_items_from_keyword(keyword)
    _create_items_recursively(db, generated_items_json, list_id, None)
    
    return get_todo_list_by_id(list_id, user)


def create_subtasks_for_item(user: Any, parent_item_id: str) -> Dict[str, Any]:
    """
    특정 아이템의 하위 작업 생성
    """
    db = get_firestore_db()
    
    parent_doc = db.collection('todo_items').document(parent_item_id).get()
    if not parent_doc.exists:
        return None
    
    parent_item = parent_doc.to_dict()
    parent_item['id'] = parent_doc.id
    
    list_doc = db.collection('todo_lists').document(parent_item['todo_list_id']).get()
    if not list_doc.exists or list_doc.to_dict().get('user_id') != user.id:
        return None
    
    todo_list = list_doc.to_dict()
    
    context_path = []
    current_item = parent_item
    
    while current_item:
        context_path.insert(0, current_item['description'])
        if current_item.get('parent_id'):
            parent_doc_ref = db.collection('todo_items').document(current_item['parent_id']).get()
            if parent_doc_ref.exists:
                current_item = parent_doc_ref.to_dict()
                current_item['id'] = parent_doc_ref.id
            else:
                break
        else:
            break
    
    sub_task_descriptions = generate_sub_tasks_from_main_task(
        main_task_description=parent_item['description'],
        project_keyword=todo_list['keyword'],
        context_path=context_path
    )
    
    for order, description in enumerate(sub_task_descriptions):
        sub_task_id = str(uuid.uuid4())
        sub_task = {
            "id": sub_task_id,
            "todo_list_id": parent_item['todo_list_id'],
            "parent_id": parent_item_id,
            "description": description,
            "is_completed": False,
            "order": order,
            "priority": "none",
            "due_date": None,
            "reminder_date": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        db.collection('todo_items').document(sub_task_id).set(sub_task)
    
    return get_todo_item_by_id(parent_item_id)


def get_todo_lists_by_user(user: Any) -> List[Dict[str, Any]]:
    """
    사용자의 모든 Todo 리스트 가져오기 (최적화된 방식)
    """
    db = get_firestore_db()
    lists_ref = db.collection('todo_lists').where('user_id', '==', user.id).stream()
    
    all_lists = []
    for doc in lists_ref:
        list_data = doc.to_dict()
        list_data['id'] = doc.id
        list_data['items'] = _fetch_and_build_tree_for_list(doc.id)
        all_lists.append(list_data)
    
    return all_lists

def get_todo_list_by_id(list_id: str, user: Any) -> Dict[str, Any]:
    """
    특정 Todo 리스트 가져오기 (최적화된 방식)
    """
    db = get_firestore_db()
    doc = db.collection('todo_lists').document(list_id).get()
    
    if not doc.exists:
        return None
    
    list_data = doc.to_dict()
    if list_data.get('user_id') != user.id:
        return None
    
    list_data['id'] = doc.id
    list_data['items'] = _fetch_and_build_tree_for_list(list_id)
    
    return list_data


def get_todo_item_by_id(item_id: str) -> Dict[str, Any]:
    """
    특정 Todo 아이템과 그 자식들을 가져오기 (최적화된 방식)
    """
    db = get_firestore_db()
    doc = db.collection('todo_items').document(item_id).get()
    
    if not doc.exists:
        return None
    
    item_data = doc.to_dict()
    item_data['id'] = doc.id
    
    # 전체 리스트의 트리를 빌드하여 해당 아이템을 찾습니다.
    # 이 방식은 특정 아이템 조회 시에는 비효율적일 수 있으나, 구조의 일관성을 유지합니다.
    full_tree = _fetch_and_build_tree_for_list(item_data['todo_list_id'])
    
    def find_item_in_tree(items, target_id):
        for item in items:
            if item['id'] == target_id:
                return item
            found = find_item_in_tree(item['children'], target_id)
            if found:
                return found
        return None

    found_item = find_item_in_tree(full_tree, item_id)
    return found_item or item_data # 트리에 문제가 있을 경우 원본 데이터 반환


def update_todo_list(list_id: str, user: Any, list_update: ToDoListUpdate) -> Dict[str, Any]:
    """
    Todo 리스트 업데이트
    """
    db = get_firestore_db()
    doc_ref = db.collection('todo_lists').document(list_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        return None
    
    list_data = doc.to_dict()
    if list_data.get('user_id') != user.id:
        return None
    
    update_data = list_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    doc_ref.update(update_data)
    
    return get_todo_list_by_id(list_id, user)


def update_todo_item(item_id: str, user: Any, item_update: ToDoItemUpdate) -> Dict[str, Any]:
    """
    Todo 아이템 업데이트
    """
    db = get_firestore_db()
    item_doc_ref = db.collection('todo_items').document(item_id)
    item_doc = item_doc_ref.get()
    
    if not item_doc.exists:
        return None
    
    item_data = item_doc.to_dict()
    
    list_doc = db.collection('todo_lists').document(item_data['todo_list_id']).get()
    if not list_doc.exists or list_doc.to_dict().get('user_id') != user.id:
        return None
    
    update_data = item_update.model_dump(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    item_doc_ref.update(update_data)
    
    return get_todo_item_by_id(item_id)


def delete_todo_item(item_id: str, user: Any) -> bool:
    """
    Todo 아이템 삭제 (자식 아이템도 함께 삭제)
    """
    db = get_firestore_db()
    item_doc = db.collection('todo_items').document(item_id).get()
    
    if not item_doc.exists:
        return False
    
    item_data = item_doc.to_dict()
    
    list_doc = db.collection('todo_lists').document(item_data['todo_list_id']).get()
    if not list_doc.exists or list_doc.to_dict().get('user_id') != user.id:
        return False
    
    # 모든 자식 아이템을 재귀적으로 삭제
    all_items_in_list = _fetch_and_build_tree_for_list(item_data['todo_list_id'])
    
    items_to_delete = []
    
    def find_and_collect_children(items, target_id):
        for item in items:
            if item['id'] == target_id:
                items_to_delete.append(item['id'])
                for child in item['children']:
                    collect_all_children(child)
                return
            find_and_collect_children(item['children'], target_id)

    def collect_all_children(item):
        items_to_delete.append(item['id'])
        for child in item['children']:
            collect_all_children(child)

    find_and_collect_children(all_items_in_list, item_id)

    for i_id in items_to_delete:
        db.collection('todo_items').document(i_id).delete()
    
    return True


def delete_todo_list(list_id: str, user: Any) -> bool:
    """
    Todo 리스트 삭제 (모든 아이템 포함)
    """
    db = get_firestore_db()
    list_doc = db.collection('todo_lists').document(list_id).get()
    
    if not list_doc.exists:
        return False
    
    list_data = list_doc.to_dict()
    if list_data.get('user_id') != user.id:
        return False
    
    # 모든 아이템 삭제
    items_ref = db.collection('todo_items').where('todo_list_id', '==', list_id).stream()
    for item in items_ref:
        item.reference.delete()
    
    # 리스트 삭제
    db.collection('todo_lists').document(list_id).delete()
    
    return True
