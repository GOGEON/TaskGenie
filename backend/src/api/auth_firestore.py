"""
인증 API 라우터 모듈 (Firestore)

사용자 인증 관련 REST API 엔드포인트를 정의.

주요 엔드포인트:
- POST /auth/register: 사용자 등록
- POST /auth/login: 로그인 및 토큰 발급
- POST /auth/social-login: 소셜 로그인 (Google, GitHub)
- POST /auth/naver-callback: 네이버 OAuth 콜백
- POST /auth/kakao-callback: 카카오 OAuth 콜백

지원되는 인증 방식:
- 기본 인증 (username/password)
- Google Firebase 인증
- 네이버 OAuth 2.0
- 카카오 OAuth 2.0
"""
import os
import requests
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from firebase_admin import auth as firebase_auth

from ..schemas import Token, UserCreate, SocialLoginRequest, NaverCallbackRequest, KakaoCallbackRequest

# 환경 변수에서 DB 타입 확인
USE_FIRESTORE = os.getenv("USE_FIRESTORE", "false").lower() == "true"

if USE_FIRESTORE:
    from ..services import auth_service_firestore as auth_service
else:
    from ..services import auth_service
    from ..database import get_db
    from sqlalchemy.orm import Session
    from ..models.user import User

router = APIRouter()

# ==================== OAuth 설정 ====================
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")
KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET")


# ==================== 기본 인증 엔드포인트 ====================
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user_create: UserCreate):
    """
    사용자 등록.
    
    Args:
        user_create: 사용자 정보 (username, password, email)
    
    Returns:
        등록 성공 메시지
    
    Raises:
        400: 이미 등록된 username
    """
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


@router.post("/social-login", response_model=Token)
# [추가] 소셜 로그인(Google, GitHub) 엔드포인트 – OAuth 인증 지원
def social_login(social_login_req: SocialLoginRequest):
    """소셜 로그인 (Google, GitHub)"""
    if not USE_FIRESTORE:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Social login is only supported with Firestore"
        )
    
    try:
        # Firebase ID 토큰 검증
        from firebase_admin import auth as firebase_auth
        decoded_token = firebase_auth.verify_id_token(social_login_req.id_token)
        firebase_uid = decoded_token['uid']
        
        # 사용자 정보 생성 또는 조회
        # Google 로그인 사용자는 'google_' prefix 추가
        email_prefix = social_login_req.email.split('@')[0]
        username = f"google_{email_prefix}"
        
        # 기존 사용자 확인
        existing_user = auth_service.get_user_by_username(username)
        
        if not existing_user:
            # 새 사용자 생성 (소셜 로그인은 비밀번호 불필요)
            # 랜덤 비밀번호 생성 (실제로는 사용되지 않음)
            import secrets
            random_password = secrets.token_urlsafe(32)
            hashed_password = auth_service.get_password_hash(random_password)
            
            auth_service.create_user(
                username=username,
                email=social_login_req.email,
                hashed_password=hashed_password
            )
        
        # JWT 토큰 생성
        access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth_service.create_access_token(
            data={"sub": username}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid social login token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/naver-callback", response_model=Token)
# [추가] 네이버 로그인 콜백 처리 – OAuth 2.0 인증 흐름
def naver_callback(callback_req: NaverCallbackRequest):
    """네이버 OAuth 콜백 처리"""
    if not USE_FIRESTORE:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Social login is only supported with Firestore"
        )
    
    try:
        # 1. 액세스 토큰 발급
        token_url = "https://nid.naver.com/oauth2.0/token"
        token_params = {
            "grant_type": "authorization_code",
            "client_id": NAVER_CLIENT_ID,
            "client_secret": NAVER_CLIENT_SECRET,
            "code": callback_req.code,
            "state": callback_req.state
        }
        
        token_response = requests.post(token_url, params=token_params)
        token_data = token_response.json()
        
        if "access_token" not in token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Failed to get access token: {token_data.get('error_description')}"
            )
        
        access_token = token_data["access_token"]
        
        # 2. 사용자 정보 조회
        profile_url = "https://openapi.naver.com/v1/nid/me"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        profile_response = requests.get(profile_url, headers=headers)
        profile_data = profile_response.json()
        
        if profile_data.get("resultcode") != "00":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to get user profile"
            )
        
        user_info = profile_data["response"]
        email = user_info.get("email")
        name = user_info.get("name") or user_info.get("nickname")
        
        # 3. 사용자 생성 또는 조회
        # 네이버 로그인 사용자는 'naver_' prefix 추가
        if email:
            email_prefix = email.split('@')[0]
            username = f"naver_{email_prefix}"
        else:
            username = f"naver_{user_info.get('id')}"
        
        existing_user = auth_service.get_user_by_username(username)
        
        if not existing_user:
            import secrets
            random_password = secrets.token_urlsafe(32)
            hashed_password = auth_service.get_password_hash(random_password)
            
            auth_service.create_user(
                username=username,
                email=email or f"{username}@naver.social",
                hashed_password=hashed_password
            )
        
        # 4. JWT 토큰 생성
        access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
        jwt_token = auth_service.create_access_token(
            data={"sub": username}, expires_delta=access_token_expires
        )
        
        return {"access_token": jwt_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Naver login failed: {str(e)}"
        )


@router.post("/kakao-callback", response_model=Token)
# [추가] 카카오 로그인 콜백 처리 – OAuth 2.0 인증 흐름
def kakao_callback(callback_req: KakaoCallbackRequest):
    """카카오 OAuth 콜백 처리"""
    if not USE_FIRESTORE:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Social login is only supported with Firestore"
        )
    
    try:
        # 1. 액세스 토큰 발급
        token_url = "https://kauth.kakao.com/oauth/token"
        token_data = {
            "grant_type": "authorization_code",
            "client_id": KAKAO_CLIENT_ID,
            "redirect_uri": callback_req.redirect_uri,
            "code": callback_req.code
        }
        
        if KAKAO_CLIENT_SECRET:
            token_data["client_secret"] = KAKAO_CLIENT_SECRET
        
        token_response = requests.post(token_url, data=token_data)
        token_result = token_response.json()
        
        if "access_token" not in token_result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Failed to get access token: {token_result.get('error_description')}"
            )
        
        access_token = token_result["access_token"]
        
        # 2. 사용자 정보 조회
        profile_url = "https://kapi.kakao.com/v2/user/me"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        profile_response = requests.get(profile_url, headers=headers)
        profile_data = profile_response.json()
        
        kakao_account = profile_data.get("kakao_account", {})
        email = kakao_account.get("email")
        profile = kakao_account.get("profile", {})
        nickname = profile.get("nickname")
        
        if not nickname:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Kakao nickname is required"
            )
        
        # 3. 사용자 생성 또는 조회
        # 카카오 로그인 사용자는 'kakao_' prefix 추가
        if email:
            email_prefix = email.split('@')[0]
            username = f"kakao_{email_prefix}"
        else:
            username = f"kakao_{profile_data.get('id')}"
        
        existing_user = auth_service.get_user_by_username(username)
        
        if not existing_user:
            import secrets
            random_password = secrets.token_urlsafe(32)
            hashed_password = auth_service.get_password_hash(random_password)
            
            # 이메일이 없으면 가상 이메일 생성
            user_email = email if email else f"{username}@kakao.social"
            
            auth_service.create_user(
                username=username,
                email=user_email,
                hashed_password=hashed_password
            )
        
        # 4. JWT 토큰 생성
        access_token_expires = timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES)
        jwt_token = auth_service.create_access_token(
            data={"sub": username}, expires_delta=access_token_expires
        )
        
        return {"access_token": jwt_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Kakao login failed: {str(e)}"
        )
