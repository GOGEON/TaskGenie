# 빠른 작업 생성 스키마 (AI 파싱 없이 직접 생성)
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class QuickToDoItemCreate(BaseModel):
    """빠른 작업 생성 요청 (AI 파싱 없음)"""
    description: str
    list_id: str
    priority: Optional[str] = "none"  # 'none' | 'low' | 'medium' | 'high'
    due_date: Optional[datetime] = None
