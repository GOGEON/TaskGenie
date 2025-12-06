"""
할 일 API 라우터 모듈 (Firestore)

할 일 관련 REST API 엔드포인트를 정의.

주요 엔드포인트:
- POST /todos/items: 빠른 작업 추가 (AI 파싱 없음)
- POST /todos/parse-and-create-item: 자연어 파싱 기반 작업 생성
- POST /todos/generate: AI 기반 프로젝트 생성
- POST /todos/items/{id}/generate-subtasks: 서브태스크 AI 생성
- GET /todos: 전체 프로젝트 목록 조회
- GET /todos/{id}: 특정 프로젝트 조회
- PUT /todos/{id}: 프로젝트 업데이트
- PUT /todos/items/{id}: 아이템 업데이트
- DELETE /todos/items/{id}: 아이템 삭제
- DELETE /todos/{id}: 프로젝트 삭제
"""
from typing import List, Any
import os

from fastapi import APIRouter, Depends, HTTPException, status, Body

from ..services.auth_service_firestore import get_current_user
from ..services import todo_service_firestore as todo_service
from ..services.nlp_parser import nlp_parser
from ..schemas import (
    ToDoListCreate, ToDoListResponse, ToDoItemUpdate, 
    ToDoItemResponse, ToDoListUpdate, NaturalLanguageTaskCreate
)


router = APIRouter()


# ==================== 아이템 생성 엔드포인트 ====================
@router.post("/items", response_model=ToDoItemResponse)
def create_todo_item_fast(
    description: str = Body(...),
    list_id: str = Body(...),
    priority: str = Body("none"),
    due_date: str = Body(None),
    parent_id: str = Body(None),
    current_user: Any = Depends(get_current_user),
):
    """
    빠른 작업 추가 (AI 파싱 없이 직접 생성).
    
    Quick Add 모달에서 사용. AI 응답 대기 없이 즉시 작업 생성.
    
    Args:
        description: 작업 내용
        list_id: 프로젝트 ID
        priority: 우선순위 (high/medium/low/none)
        due_date: 마감일 (ISO 형식)
        parent_id: 상위 작업 ID (하위 작업 생성 시)
    
    Returns:
        생성된 작업 아이템
    
    Raises:
        404: 프로젝트를 찾을 수 없거나 권한 없음
    """
    from datetime import datetime
    from zoneinfo import ZoneInfo
    import uuid
    from ..firestore_db import get_firestore_db
    
    db = get_firestore_db()
    
    # Validate priority
    valid_priorities = ["high", "medium", "low", "none"]
    if priority not in valid_priorities:
        priority = "none"
    
    # Verify list exists and belongs to user
    list_doc = db.collection('todo_lists').document(list_id).get()
    if not list_doc.exists or list_doc.to_dict().get('user_id') != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="To-Do List not found or you do not have permission to access it.",
        )
    
    # Get order for new item (count items at the same parent level)
    items_query = db.collection('todo_items').where('todo_list_id', '==', list_id).where('parent_id', '==', parent_id).stream()
    order = sum(1 for _ in items_query)
    
    # Create item
    item_id = str(uuid.uuid4())
    
    # Handle due date if provided
    due_date_obj = None
    if due_date:
        try:
            naive_dt = datetime.fromisoformat(due_date)
            kst = ZoneInfo("Asia/Seoul")
            due_date_obj = naive_dt.replace(tzinfo=kst)
        except (ValueError, TypeError):
            due_date_obj = None
    
    new_item_doc = {
        "id": item_id,
        "todo_list_id": list_id,
        "parent_id": parent_id,  # [수정] 요청에서 받은 parent_id 사용
        "description": description,
        "is_completed": False,
        "order": order,
        "priority": priority,
        "due_date": due_date_obj,
        "reminder_date": None,
        "created_at": datetime.now(ZoneInfo("Asia/Seoul")),
        "updated_at": datetime.now(ZoneInfo("Asia/Seoul")),
    }
    
    db.collection('todo_items').document(item_id).set(new_item_doc)
    
    # Return created item
    return todo_service.get_todo_item_by_id(item_id)


@router.post("/parse-and-create-item", response_model=ToDoItemResponse)
def parse_and_create_todo_item(
    task_create: NaturalLanguageTaskCreate,
    current_user: Any = Depends(get_current_user),
):
    """
    Parses a natural language string to create a new ToDo item.
    """
    # 1. Parse the natural language text to get structured data
    parsed_data = nlp_parser.parse_task(task_create.text)
    if not parsed_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not parse the provided text.",
        )

    # 2. Create the ToDo item in the specified list
    new_item = todo_service.create_todo_item_from_parsed_data(
        user=current_user,
        list_id=task_create.list_id,
        parsed_data=parsed_data
    )

    if not new_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="To-Do List not found or you do not have permission to access it.",
        )

    return new_item


@router.post("/generate", response_model=ToDoListResponse)
def generate_todo_list(
    todo_list_create: ToDoListCreate,
    current_user: Any = Depends(get_current_user),
):
    """AI를 사용하여 새로운 Todo 리스트 생성"""
    todo_list = todo_service.create_todo_list_with_ai_items(current_user, todo_list_create.keyword)
    return todo_list


@router.post("/items/{item_id}/generate-subtasks", response_model=ToDoItemResponse)
def generate_subtasks_for_item(
    item_id: str,
    current_user: Any = Depends(get_current_user),
):
    """특정 아이템의 하위 작업 AI 생성"""
    updated_parent_item = todo_service.create_subtasks_for_item(current_user, item_id)
    if not updated_parent_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent item not found or not authorized")
    return updated_parent_item


@router.get("", response_model=List[ToDoListResponse])
def get_all_todo_lists(
    current_user: Any = Depends(get_current_user),
):
    """사용자의 모든 Todo 리스트 조회"""
    todo_lists = todo_service.get_todo_lists_by_user(current_user)
    return todo_lists


@router.get("/{list_id}", response_model=ToDoListResponse)
def get_single_todo_list(
    list_id: str,
    current_user: Any = Depends(get_current_user),
):
    """특정 Todo 리스트 상세 조회"""
    todo_list = todo_service.get_todo_list_by_id(list_id, current_user)
    if not todo_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="To-Do List not found or not authorized")
    return todo_list


@router.put("/{list_id}", response_model=ToDoListResponse)
def update_todo_list_endpoint(
    list_id: str,
    list_update: ToDoListUpdate,
    current_user: Any = Depends(get_current_user),
):
    """Todo 리스트 업데이트"""
    updated_list = todo_service.update_todo_list(list_id, current_user, list_update)
    if not updated_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="To-Do List not found or not authorized")
    return updated_list


@router.put("/items/{item_id}", response_model=ToDoItemResponse)
def update_todo_item_endpoint(
    item_id: str,
    item_update: ToDoItemUpdate,
    current_user: Any = Depends(get_current_user),
):
    """Todo 아이템 업데이트"""
    updated_item = todo_service.update_todo_item(item_id, current_user, item_update)
    if not updated_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="To-Do Item not found or not authorized")
    return updated_item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo_item_endpoint(
    item_id: str,
    current_user: Any = Depends(get_current_user),
):
    """Todo 아이템 삭제"""
    success = todo_service.delete_todo_item(item_id, current_user)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="To-Do Item not found or not authorized")
    return


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo_list_endpoint(
    list_id: str,
    current_user: Any = Depends(get_current_user),
):
    """Todo 리스트 삭제"""
    success = todo_service.delete_todo_list(list_id, current_user)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="To-Do List not found or not authorized")
    return
