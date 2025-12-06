"""
TaskGenie Backend 메인 모듈

FastAPI 애플리케이션의 진입점으로, 다음 기능을 담당:
- 앱 초기화 및 환경 설정
- 데이터베이스 연결 (Firestore/SQLite)
- CORS 미들웨어 설정
- API 라우터 등록
- 전역 예외 처리
"""
import logging
import os
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# ==================== 환경 설정 ====================
# Render 배포 환경이 아닌 경우에만 .env 파일 로드
if os.getenv("RENDER") is None:
    load_dotenv()

# ==================== 데이터베이스 초기화 ====================
# 환경 변수에 따라 Firestore 또는 SQLite 사용
USE_FIRESTORE = os.getenv("USE_FIRESTORE", "false").lower() == "true"

if USE_FIRESTORE:
    # Firestore (클라우드 DB) 초기화
    from .firestore_db import initialize_firestore
    initialize_firestore()
    from .api import auth_firestore as auth
    from .api import todos_firestore as todos
else:
    # SQLite (로컬 DB) 초기화
    from .database import Base, engine
    Base.metadata.create_all(bind=engine)
    from .api import auth, todos

# ==================== FastAPI 앱 생성 ====================
app = FastAPI()

# ==================== CORS 미들웨어 설정 ====================
# 허용된 프론트엔드 도메인 목록
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [
    "http://localhost:5173",    # 로컬 개발 (Vite 기본 포트)
    "http://localhost:5174",    # 로컬 개발 (대체 포트)
    frontend_url,               # 환경 변수로 지정된 URL
    "https://taskgenieapp.vercel.app",  # 프로덕션 도메인
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,     # 쿠키/인증 헤더 허용
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ==================== 로깅 설정 ====================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== 라우터 등록 ====================
# 인증 관련 엔드포인트: /auth/*
app.include_router(auth.router, prefix="/auth", tags=["auth"])
# 할 일 관련 엔드포인트: /todos/*
app.include_router(todos.router, prefix="/todos", tags=["todos"])


# ==================== 전역 예외 처리 ====================
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    요청 유효성 검사 실패 시 처리.
    
    잘못된 요청 형식(필수 필드 누락, 타입 불일치 등)에 대해
    422 상태 코드와 상세 오류 정보를 반환.
    """
    logger.error(f"Validation error: {exc.errors()} for request: {request.url}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    예상치 못한 서버 오류 처리.
    
    처리되지 않은 모든 예외를 캐치하여 500 상태 코드 반환.
    오류 상세 정보는 로그에만 기록하고 클라이언트에는 노출하지 않음.
    """
    logger.error(f"An unexpected error occurred: {exc} for request: {request.url}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "Internal Server Error"},
    )


# ==================== 루트 엔드포인트 ====================
@app.get("/", tags=["root"])
async def root():
    """API 서버 상태 확인용 루트 엔드포인트."""
    return {"message": "Welcome to the AI Task Generator API"}
