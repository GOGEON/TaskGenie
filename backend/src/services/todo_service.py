from typing import List
from sqlalchemy.orm import Session
import uuid

from ..models.todo import ToDoList, ToDoItem
from ..models.user import User
from ..schemas import ToDoItemUpdate, ToDoListUpdate
from ..services.ai_service import generate_todo_items_from_keyword, generate_sub_tasks_from_main_task

from typing import List, Dict, Any

def _create_items_recursively(db: Session, items_data: List[Dict[str, Any]], todo_list_id: uuid.UUID, parent_id: uuid.UUID = None):
    for order, item_data in enumerate(items_data):
        db_item = ToDoItem(
            todo_list_id=todo_list_id,
            parent_id=parent_id,
            description=item_data["description"],
            order=order
        )
        db.add(db_item)
        db.flush()

        if "children" in item_data and item_data["children"]:
            _create_items_recursively(db, item_data["children"], todo_list_id, db_item.id)

def create_todo_list_with_ai_items(db: Session, user: User, keyword: str) -> ToDoList:
    todo_list = ToDoList(
        user_id=user.id, 
        keyword=keyword,
        color="#3b82f6",
        icon="📋"
    )
    db.add(todo_list)
    db.flush()

    generated_items_json = generate_todo_items_from_keyword(keyword)
    
    _create_items_recursively(db, generated_items_json, todo_list.id, None)
    
    db.commit()
    db.refresh(todo_list)
    return todo_list

def create_subtasks_for_item(db: Session, user: User, parent_item_id: uuid.UUID) -> ToDoItem:
    parent_item = db.query(ToDoItem).filter(ToDoItem.id == parent_item_id).first()
    if not parent_item:
        return None
    
    todo_list = db.query(ToDoList).filter(ToDoList.id == parent_item.todo_list_id, ToDoList.user_id == user.id).first()
    if not todo_list:
        return None

    # 프로젝트 키워드와 상위 항목들의 맥락 수집
    context_path = []
    current_item = parent_item
    
    # 부모 항목들을 역순으로 추적
    while current_item:
        context_path.insert(0, current_item.description)
        if current_item.parent_id:
            current_item = db.query(ToDoItem).filter(ToDoItem.id == current_item.parent_id).first()
        else:
            break
    
    # 프로젝트 키워드를 맨 앞에 추가
    project_keyword = todo_list.keyword
    
    # AI에게 전체 맥락 전달
    sub_task_descriptions = generate_sub_tasks_from_main_task(
        main_task_description=parent_item.description,
        project_keyword=project_keyword,
        context_path=context_path
    )

    for order, description in enumerate(sub_task_descriptions):
        sub_task = ToDoItem(
            todo_list_id=parent_item.todo_list_id,
            parent_id=parent_item.id,
            description=description,
            order=order
        )
        db.add(sub_task)
    
    db.commit()
    db.refresh(parent_item)
    return parent_item

def get_todo_lists_by_user(db: Session, user: User) -> List[ToDoList]:
    return db.query(ToDoList).filter(ToDoList.user_id == user.id).all()

def get_todo_list_by_id(db: Session, list_id: uuid.UUID, user: User) -> ToDoList:
    return db.query(ToDoList).filter(ToDoList.id == list_id, ToDoList.user_id == user.id).first()

def update_todo_list(db: Session, list_id: uuid.UUID, user: User, list_update: ToDoListUpdate) -> ToDoList:
    todo_list = db.query(ToDoList).filter(ToDoList.id == list_id, ToDoList.user_id == user.id).first()
    if not todo_list:
        return None
    
    update_data = list_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(todo_list, key, value)
    
    db.commit()
    db.refresh(todo_list)
    return todo_list

def update_todo_item(db: Session, item_id: uuid.UUID, user: User, item_update: ToDoItemUpdate) -> ToDoItem:
    todo_item = db.query(ToDoItem).filter(ToDoItem.id == item_id).first()
    if not todo_item:
        return None
    
    todo_list = db.query(ToDoList).filter(ToDoList.id == todo_item.todo_list_id, ToDoList.user_id == user.id).first()
    if not todo_list:
        return None

    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(todo_item, key, value)
        
    db.commit()
    db.refresh(todo_item)
    return todo_item

def delete_todo_item(db: Session, item_id: uuid.UUID, user: User) -> bool:
    todo_item = db.query(ToDoItem).filter(ToDoItem.id == item_id).first()
    if not todo_item:
        return False
        
    todo_list = db.query(ToDoList).filter(ToDoList.id == todo_item.todo_list_id, ToDoList.user_id == user.id).first()
    if not todo_list:
        return False

    db.delete(todo_item)
    db.commit()
    return True

def delete_todo_list(db: Session, list_id: uuid.UUID, user: User):
    import time
    max_retries = 3
    retry_delay = 0.5  # 500ms
    
    for attempt in range(max_retries):
        try:
            todo_list = db.query(ToDoList).filter(ToDoList.id == list_id, ToDoList.user_id == user.id).first()
            if todo_list:
                db.delete(todo_list)
                db.commit()
                return True
            return False
        except Exception as e:
            if "database is locked" in str(e) and attempt < max_retries - 1:
                db.rollback()
                time.sleep(retry_delay)
                retry_delay *= 2  # 지수 백오프
            else:
                db.rollback()
                raise
    return False
