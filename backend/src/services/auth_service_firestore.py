"""
Firestore 기반 인증 서비스
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

# JWT 설정
SECRET_KEY = os.getenv("SECRET_KEY", "a_default_secret_key_for_testing")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7일

pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def verify_password(plain_password, hashed_password):
    """비밀번호 검증"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """비밀번호 해싱"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """JWT 액세스 토큰 생성"""
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
