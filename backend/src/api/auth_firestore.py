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
import secrets
from datetime import timedelta
from typing import Optional
import os

import requests
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from firebase_admin import auth as firebase_auth

from ..schemas import Token, UserCreate, SocialLoginRequest, NaverCallbackRequest, KakaoCallbackRequest
from ..services import auth_service_firestore as auth_service

router = APIRouter()

# ==================== OAuth 설정 ====================
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")
KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET")

# 외부 OAuth 서버 요청 타임아웃 (초)
OAUTH_TIMEOUT = 10


# ==================== 내부 헬퍼 ====================

def _issue_token(username: str) -> dict:
    """사용자 이름으로 JWT 액세스 토큰 발급."""
    access_token = auth_service.create_access_token(
        data={"sub": username},
        expires_delta=timedelta(minutes=auth_service.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}


def _social_username(provider: str, email: Optional[str], fallback_id) -> str:
    """소셜 로그인 사용자 이름 생성 ('{provider}_{이메일 앞부분}' 또는 '{provider}_{id}')."""
    if email:
        return f"{provider}_{email.split('@')[0]}"
    return f"{provider}_{fallback_id}"


def _ensure_social_user(username: str, email: str) -> None:
    """
    소셜 로그인 사용자가 없으면 생성.
    소셜 로그인은 비밀번호를 쓰지 않으므로 사용되지 않는 랜덤 비밀번호를 저장한다.
    """
    if auth_service.get_user_by_username(username):
        return
    auth_service.create_user(
        username=username,
        email=email,
        hashed_password=auth_service.get_password_hash(secrets.token_urlsafe(32)),
    )


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def _fetch_oauth_access_token(response: requests.Response) -> str:
    """OAuth 토큰 응답에서 access_token 추출 (없으면 401)."""
    token_data = response.json()
    if "access_token" not in token_data:
        raise _unauthorized(f"Failed to get access token: {token_data.get('error_description')}")
    return token_data["access_token"]


# ==================== 기본 인증 엔드포인트 ====================
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user_create: UserCreate):
    """
    사용자 등록.

    Raises:
        400: 이미 등록된 username
    """
    if auth_service.get_user_by_username(user_create.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    hashed_password = auth_service.get_password_hash(user_create.password)
    auth_service.create_user(user_create.username, user_create.email, hashed_password)
    return {"message": "User registered successfully"}


@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """로그인 및 액세스 토큰 발급"""
    user = auth_service.get_user_by_username(form_data.username)
    if not user or not auth_service.verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _issue_token(form_data.username)


# ==================== 소셜 로그인 엔드포인트 ====================
@router.post("/social-login", response_model=Token)
def social_login(social_login_req: SocialLoginRequest):
    """소셜 로그인 (Google) - Firebase ID 토큰 검증 후 JWT 발급"""
    try:
        firebase_auth.verify_id_token(social_login_req.id_token)
        username = _social_username("google", social_login_req.email, None)
        _ensure_social_user(username, social_login_req.email)
        return _issue_token(username)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid social login token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/naver-callback", response_model=Token)
def naver_callback(callback_req: NaverCallbackRequest):
    """네이버 OAuth 콜백 처리 (인가 코드 → 액세스 토큰 → 프로필 → JWT)"""
    try:
        access_token = _fetch_oauth_access_token(requests.post(
            "https://nid.naver.com/oauth2.0/token",
            params={
                "grant_type": "authorization_code",
                "client_id": NAVER_CLIENT_ID,
                "client_secret": NAVER_CLIENT_SECRET,
                "code": callback_req.code,
                "state": callback_req.state,
            },
            timeout=OAUTH_TIMEOUT,
        ))

        profile_data = requests.get(
            "https://openapi.naver.com/v1/nid/me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=OAUTH_TIMEOUT,
        ).json()
        if profile_data.get("resultcode") != "00":
            raise _unauthorized("Failed to get user profile")

        user_info = profile_data["response"]
        email = user_info.get("email")
        username = _social_username("naver", email, user_info.get("id"))
        _ensure_social_user(username, email or f"{username}@naver.social")
        return _issue_token(username)

    except HTTPException:
        raise
    except Exception as e:
        raise _unauthorized(f"Naver login failed: {str(e)}")


@router.post("/kakao-callback", response_model=Token)
def kakao_callback(callback_req: KakaoCallbackRequest):
    """카카오 OAuth 콜백 처리 (인가 코드 → 액세스 토큰 → 프로필 → JWT)"""
    try:
        token_request = {
            "grant_type": "authorization_code",
            "client_id": KAKAO_CLIENT_ID,
            "redirect_uri": callback_req.redirect_uri,
            "code": callback_req.code,
        }
        if KAKAO_CLIENT_SECRET:
            token_request["client_secret"] = KAKAO_CLIENT_SECRET
        access_token = _fetch_oauth_access_token(requests.post(
            "https://kauth.kakao.com/oauth/token", data=token_request, timeout=OAUTH_TIMEOUT,
        ))

        profile_data = requests.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=OAUTH_TIMEOUT,
        ).json()
        kakao_account = profile_data.get("kakao_account", {})
        if not kakao_account.get("profile", {}).get("nickname"):
            raise _unauthorized("Kakao nickname is required")

        email = kakao_account.get("email")
        username = _social_username("kakao", email, profile_data.get("id"))
        _ensure_social_user(username, email or f"{username}@kakao.social")
        return _issue_token(username)

    except HTTPException:
        raise
    except Exception as e:
        raise _unauthorized(f"Kakao login failed: {str(e)}")


# ==================== 회원탈퇴 ====================
@router.delete("/me", status_code=status.HTTP_200_OK)
def delete_my_account(current_user = Depends(auth_service.get_current_user)):
    """
    현재 로그인한 사용자의 계정 삭제 (회원탈퇴).
    사용자 정보와 해당 사용자의 모든 프로젝트, 할 일 항목이 삭제됨.
    """
    try:
        auth_service.delete_user(current_user.id)
        return {"message": "Account deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )
