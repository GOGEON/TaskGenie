"""
Firestore 기반 인증 API
"""
import os
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from ..schemas import Token, UserCreate

# Firestore 사용 여부 확인
USE_FIRESTORE = os.getenv("USE_FIRESTORE", "false").lower() == "true"

if USE_FIRESTORE:
    from ..services import auth_service_firestore as auth_service
else:
    from ..services import auth_service
    from ..database import get_db
    from sqlalchemy.orm import Session
    from ..models.user import User

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user_create: UserCreate):
    """사용자 등록"""
    if USE_FIRESTORE:
        # Firestore 버전
        existing_user = auth_service.get_user_by_username(user_create.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        hashed_password = auth_service.get_password_hash(user_create.password)
        auth_service.create_user(user_create.username, user_create.email, hashed_password)
        
    else:
        # SQLite 버전
        db = next(get_db())
        try:
            user = db.query(User).filter(User.username == user_create.username).first()
            if user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already registered"
                )
            
            hashed_password = auth_service.get_password_hash(user_create.password)
            db_user = User(
                username=user_create.username,
                hashed_password=hashed_password,
                email=user_create.email
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        finally:
            db.close()
    
    return {"message": "User registered successfully"}


@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """로그인 및 액세스 토큰 발급"""
    if USE_FIRESTORE:
        # Firestore 버전
        user = auth_service.get_user_by_username(form_data.username)
        if not user or not auth_service.verify_password(form_data.password, user['hashed_password']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        # SQLite 버전
        db = next(get_db())
        try:
            user = db.query(User).filter(User.username == form_data.username).first()
            if not user or not auth_service.verify_password(form_data.password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect username or password",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        finally:
            db.close()
    
    access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
