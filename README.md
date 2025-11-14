# 🤖 TaskGenie

> AI 기반 계층적 할 일 관리 웹 애플리케이션

Google Gemini API를 활용하여 키워드로 구조화된 할 일 목록을 자동 생성하고, 드래그 앤 드롭과 재귀적 완료 추적으로 프로젝트를 관리하는 풀스택 웹 애플리케이션입니다.

![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?logo=tailwind-css)
![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python)

## ✨ 주요 기능

- **AI 기반 할 일 생성**: Google Gemini를 활용한 지능형 태스크 생성
- **무한 계층 구조**: 무제한 하위 작업 생성
- **드래그 앤 드롭**: react-dnd 기반 항목 재정렬
- **재귀적 진행률 추적**: 부모-자식 완료 상태 자동 동기화
- **JWT 인증**: 안전한 사용자 인증
- **반응형 디자인**: 모바일/데스크톱 최적화

## 🛠 기술 스택

**Frontend**: React 19.1, Vite, Tailwind CSS, react-dnd, axios  
**Backend**: FastAPI, Firebase Admin SDK, Google Cloud Firestore, JWT, Google Gemini API  
**Database**: Firestore (NoSQL Cloud Database)  
**Testing**: Vitest, pytest

## � 프로젝트 구조

```
webTP/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/   # React 컴포넌트
│   │   ├── pages/        # 페이지
│   │   ├── services/     # API 서비스
│   │   └── hooks/        # 커스텀 훅
│   └── package.json
│
├── backend/              # FastAPI 백엔드
│   ├── src/
│   │   ├── api/         # API 라우터
│   │   ├── models/      # DB 모델
│   │   ├── services/    # 비즈니스 로직
│   │   └── main.py      # 앱 진입점
│   └── tests/           # 테스트
│
└── docs/                # 문서
```


## 🚀 시작하기

### 필수 요구사항

- Node.js 18+
- Python 3.12+
- Google Gemini API Key
- Google Cloud Platform 계정 (Firestore 사용)

### 설치 및 실행

**1. 저장소 클론**
```bash
git clone https://github.com/GOGEON/TaskGenie.git
cd TaskGenie
```

**2. 백엔드 설정**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

**3. 환경 변수 설정** (`backend/.env`)
```env
GOOGLE_API_KEY=your-google-gemini-api-key
SECRET_KEY=your-secret-key-minimum-32-characters
USE_FIRESTORE=true
FIRESTORE_KEY_PATH=firestore-key.json
```

**4. Firestore 설정**
- [Firebase Console](https://console.firebase.google.com)에서 프로젝트 생성
- Firestore 데이터베이스 생성 (Native Mode, Seoul 리전)
- 서비스 계정 키 생성 후 `backend/firestore-key.json`에 저장
- 상세 가이드: [docs/FIRESTORE_MIGRATION.md](./docs/FIRESTORE_MIGRATION.md)

**5. 프론트엔드 설정**
```bash
cd frontend
npm install
```

**6. 실행**
```bash
# 터미널 1: 백엔드 (포트 8000)
cd backend
uvicorn src.main:app --reload

# 터미널 2: 프론트엔드 (포트 5173)
cd frontend
npm run dev
```

브라우저에서 http://localhost:5173 접속

## 🧪 테스트

```bash
# 프론트엔드
cd frontend
npm test

# 백엔드
cd backend
pytest
```

## 📚 API 문서

서버 실행 후 http://localhost:8000/docs 에서 Swagger UI 확인

### 주요 엔드포인트

**인증**
- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인

**할 일 관리**
- `GET /todos` - 프로젝트 목록 조회
- `POST /todos/generate` - AI 기반 프로젝트 생성
- `PUT /todos/items/{item_id}` - 항목 수정
- `DELETE /todos/items/{item_id}` - 항목 삭제
- `POST /todos/items/{item_id}/generate-subtasks` - 하위 작업 생성

## 📖 추가 문서

- **[아키텍처](./docs/architecture.md)** - 시스템 구조 설명
- **[Firestore 마이그레이션](./docs/FIRESTORE_MIGRATION.md)** - SQLite → Firestore 마이그레이션 가이드
- **[코드 변경사항](./docs/CODE_CHANGES_SUMMARY.md)** - 상세 코드 변경 내역
- **[개선 제안](./docs/IMPROVEMENT_SUGGESTIONS.md)** - 향후 개선 계획

## 🌟 주요 변경사항 (2025.11.06)

- ✅ **SQLite → Firestore 마이그레이션** - 클라우드 네이티브 아키텍처로 전환
- ✅ **확장성 개선** - 무제한 동시 접속 지원
- ✅ **자동 스케일링** - Google Cloud 인프라 활용
- ✅ **실시간 동기화 준비** - Firestore 실시간 기능 활용 가능

## � 라이선스

MIT License

## ‍💻 개발자

**GOGEON** - [@GOGEON](https://github.com/GOGEON)