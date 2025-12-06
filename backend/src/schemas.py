"""
Pydantic 스키마 모듈

API 요청/응답의 데이터 검증 및 직렬화를 위한 Pydantic 모델 정의.

주요 카테고리:
- 사용자 인증 스키마 (UserCreate, Token 등)
- 소셜 로그인 스키마 (SocialLoginRequest, NaverCallback 등)
- 할 일 스키마 (ToDoItem, ToDoList 등)
- 자연어 파싱 스키마 (NaturalLanguageTaskCreate)
"""
from typing import List, Optional
from datetime import datetime
import uuid

from pydantic import BaseModel


# ==================== 사용자 인증 스키마 ====================
class UserCreate(BaseModel):
    """사용자 등록 요청 스키마."""
    username: str           # 로그인용 사용자명
    password: str           # 평문 비밀번호 (해싱 전)
    email: Optional[str] = None


class UserLogin(BaseModel):
    """사용자 로그인 요청 스키마."""
    username: str
    password: str


class Token(BaseModel):
    """JWT 토큰 응답 스키마."""
    access_token: str       # JWT 액세스 토큰
    token_type: str         # 토큰 타입 (bearer)


class TokenData(BaseModel):
    """JWT 토큰 페이로드 데이터."""
    username: Optional[str] = None


# ==================== 소셜 로그인 스키마 ====================
class SocialLoginRequest(BaseModel):
    """
    소셜 로그인 요청 스키마.
    
    Google, GitHub 등 Firebase 기반 소셜 로그인에 사용.
    """
    provider: str           # 'google' | 'github'
    id_token: str           # Firebase ID 토큰
    email: str              # 사용자 이메일
    display_name: Optional[str] = None  # 표시 이름
    photo_url: Optional[str] = None     # 프로필 사진 URL


class NaverCallbackRequest(BaseModel):
    """네이버 OAuth 콜백 요청 스키마."""
    code: str               # 인증 코드
    state: str              # CSRF 방지용 상태 값
    redirect_uri: str       # 리다이렉트 URI


class KakaoCallbackRequest(BaseModel):
    """카카오 OAuth 콜백 요청 스키마."""
    code: str               # 인증 코드
    redirect_uri: str       # 리다이렉트 URI


# ==================== 할 일 아이템 스키마 ====================
class ToDoItemBase(BaseModel):
    """
    할 일 아이템 기본 스키마.
    
    모든 할 일 아이템에 공통으로 적용되는 필드 정의.
    """
    description: str                    # 작업 내용
    is_completed: bool = False          # 완료 여부
    order: int                          # 정렬 순서
    priority: str = 'none'              # 우선순위: 'none' | 'low' | 'medium' | 'high'
    due_date: Optional[datetime] = None # 마감일 (ISO 8601)
    reminder_date: Optional[datetime] = None  # 알림 날짜

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

class NaturalLanguageTaskCreate(BaseModel):
    text: str
    list_id: str

