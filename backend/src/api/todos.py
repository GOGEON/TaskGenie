from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..services.auth_service import get_current_user
from ..services import todo_service
from ..schemas import ToDoListCreate, ToDoListResponse, ToDoItemUpdate, ToDoItemResponse, ToDoListUpdate

router = APIRouter()

@router.post("/generate", response_model=ToDoListResponse)
def generate_todo_list(
    todo_list_create: ToDoListCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    todo_list = todo_service.create_todo_list_with_ai_items(db, current_user, todo_list_create.keyword)
    return todo_list

@router.post("/items/{item_id}/generate-subtasks", response_model=ToDoItemResponse)
def generate_subtasks_for_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated_parent_item = todo_service.create_subtasks_for_item(db, current_user, item_id)
    if not updated_parent_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent item not found or not authorized")
    return updated_parent_item

@router.get("", response_model=List[ToDoListResponse])
def get_all_todo_lists(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    todo_lists = todo_service.get_todo_lists_by_user(db, current_user)
    return todo_lists

@router.get("/{list_id}", response_model=ToDoListResponse)
def get_single_todo_list(
    list_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    todo_list = todo_service.get_todo_list_by_id(db, list_id, current_user)
    if not todo_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="To-Do List not found or not authorized")
    return todo_list

@router.put("/{list_id}", response_model=ToDoListResponse)
def update_todo_list_endpoint(
    list_id: uuid.UUID,
    list_update: ToDoListUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated_list = todo_service.update_todo_list(db, list_id, current_user, list_update)
    if not updated_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="To-Do List not found or not authorized")
    return updated_list

@router.put("/items/{item_id}", response_model=ToDoItemResponse)
def update_todo_item_endpoint(
    item_id: uuid.UUID,
    item_update: ToDoItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated_item = todo_service.update_todo_item(db, item_id, current_user, item_update)
    if not updated_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="To-Do Item not found or not authorized")
    return updated_item

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo_item_endpoint(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = todo_service.delete_todo_item(db, item_id, current_user)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="To-Do Item not found or not authorized")
    return

@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo_list_endpoint(
    list_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = todo_service.delete_todo_list(db, list_id, current_user)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="To-Do List not found or not authorized")
    return
