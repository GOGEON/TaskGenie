"""
인증 서비스 모듈 (Firestore)

사용자 인증 관련 비즈니스 로직을 담당.

주요 기능:
- 비밀번호 해싱 및 검증 (pbkdf2_sha256, bcrypt)
- JWT 액세스 토큰 생성 및 검증
- 사용자 조회 및 생성
- 현재 로그인 사용자 추출 (FastAPI Dependency)
"""
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from ..firestore_db import get_firestore_db

# ==================== JWT 설정 ====================
SECRET_KEY = os.getenv("SECRET_KEY", "a_default_secret_key_for_testing")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7일 유효

# 비밀번호 해싱 컨텍스트 (pbkdf2_sha256 우선, bcrypt 호환)
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"])

# OAuth2 토큰 URL 설정
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    평문 비밀번호와 해시 비밀번호 일치 여부 확인.
    
    Args:
        plain_password: 사용자 입력 평문 비밀번호
        hashed_password: DB에 저장된 해시 비밀번호
    
    Returns:
        일치 시 True, 불일치 시 False
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    평문 비밀번호를 해시로 변환.
    
    Args:
        password: 해싱할 평문 비밀번호
    
    Returns:
        해시된 비밀번호 문자열
    """
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT 액세스 토큰 생성.
    
    Args:
        data: 토큰에 포함할 데이터 (예: {"sub": username})
        expires_delta: 토큰 만료 시간 (기본값: 7일)
    
    Returns:
        인코딩된 JWT 토큰 문자열
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_by_username(username: str):
    """username으로 사용자 조회"""
    db = get_firestore_db()
    users_ref = db.collection('users').where('username', '==', username).limit(1)
    
    for doc in users_ref.stream():
        user_data = doc.to_dict()
        user_data['id'] = doc.id
        return user_data
    
    return None


def create_user(username: str, email: str, hashed_password: str):
    """새 사용자 생성"""
    db = get_firestore_db()
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "username": username,
        "email": email,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    db.collection('users').document(user_id).set(user_doc)
    return user_doc


def get_current_user(token: str = Depends(oauth2_scheme)):
    """JWT 토큰에서 현재 사용자 가져오기"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_username(username)
    if user is None:
        raise credentials_exception
    
    # User 객체처럼 사용할 수 있도록 클래스로 변환
    class UserObject:
        def __init__(self, data):
            self.id = data['id']
            self.username = data['username']
            self.email = data.get('email')
            self.hashed_password = data['hashed_password']
            self.created_at = data.get('created_at')
            self.updated_at = data.get('updated_at')
    
    return UserObject(user)
