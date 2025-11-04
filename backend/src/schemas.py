from typing import List, Optional
from datetime import datetime
import uuid

from pydantic import BaseModel

# User Schemas
class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ToDoItemBase(BaseModel):
    description: str
    is_completed: bool = False
    order: int
    # [추가] 우선순위 필드 - 4단계 우선순위 지원
    priority: str = 'none'  # 'none' | 'low' | 'medium' | 'high'
    # [추가] 마감일 필드 - ISO 8601 형식 datetime
    due_date: Optional[datetime] = None
    # [추가] 알림 날짜 필드 - 추후 알림 기능용
    reminder_date: Optional[datetime] = None

class ToDoItemResponse(ToDoItemBase):
    id: uuid.UUID
    children: List['ToDoItemResponse'] = []

    class Config:
        from_attributes = True

class ToDoListCreate(BaseModel):
    keyword: str
    color: Optional[str] = None
    icon: Optional[str] = None

class ToDoListUpdate(BaseModel):
    keyword: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class ToDoListResponse(BaseModel):
    id: uuid.UUID
    keyword: str
    color: Optional[str] = None
    icon: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[ToDoItemResponse]

    class Config:
        from_attributes = True

class ToDoItemUpdate(BaseModel):
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    order: Optional[int] = None
    priority: Optional[str] = None  # 'none' | 'low' | 'medium' | 'high'
    due_date: Optional[datetime] = None
    reminder_date: Optional[datetime] = None
