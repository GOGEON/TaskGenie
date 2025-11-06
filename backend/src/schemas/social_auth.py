"""
소셜 로그인 스키마
"""
from pydantic import BaseModel
from typing import Optional


class SocialLoginRequest(BaseModel):
    """소셜 로그인 요청"""
    provider: str  # 'google' or 'github'
    id_token: str
    email: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
