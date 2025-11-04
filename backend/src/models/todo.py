from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, and_
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy import DateTime
from datetime import datetime
import uuid

from ..database import Base

class ToDoList(Base):
    __tablename__ = "todo_lists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    keyword = Column(String, nullable=False)
    color = Column(String, nullable=True, default="#3b82f6")  # 기본 파란색
    icon = Column(String, nullable=True, default="📋")  # 기본 아이콘
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="todo_lists")
    items = relationship(
        "ToDoItem", 
        primaryjoin="and_(ToDoList.id==ToDoItem.todo_list_id, ToDoItem.parent_id==None)", 
        back_populates="todo_list", 
        cascade="all, delete-orphan",
        order_by="ToDoItem.order"
    )

    def __repr__(self):
        return f"<ToDoList(keyword='{self.keyword}')>"

class ToDoItem(Base):
    __tablename__ = "todo_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    todo_list_id = Column(UUID(as_uuid=True), ForeignKey("todo_lists.id"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("todo_items.id"), nullable=True)
    description = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    order = Column(Integer, nullable=False)
    # [추가] 우선순위 필드 - 4단계 (none, low, medium, high), 기본값: none
    priority = Column(String, default='none')  # 'none' | 'low' | 'medium' | 'high'
    # [추가] 마감일 필드 - 날짜/시간 정보, NULL 허용
    due_date = Column(DateTime, nullable=True)
    # [추가] 알림 날짜 필드 - 추후 알림 기능 구현 시 사용 예정
    reminder_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    todo_list = relationship("ToDoList", back_populates="items")
    parent = relationship("ToDoItem", remote_side=[id], back_populates="children")
    children = relationship("ToDoItem", back_populates="parent", cascade="all, delete-orphan", order_by="ToDoItem.order")

    def __repr__(self):
        return f"<ToDoItem(description='{self.description}')>"
