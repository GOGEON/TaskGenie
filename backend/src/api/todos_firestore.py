"""
Firestore 기반 Todo API 라우터
"""
from typing import List, Any
import os

from fastapi import APIRouter, Depends, HTTPException, status

from ..schemas import ToDoListCreate, ToDoListResponse, ToDoItemUpdate, ToDoItemResponse, ToDoListUpdate
from ..services.auth_service_firestore import get_current_user
from ..services import todo_service_firestore as todo_service

router = APIRouter()


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
