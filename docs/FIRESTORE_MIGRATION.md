# Firestore 마이그레이션 문서

## 📋 개요

TaskGenie 백엔드를 SQLite에서 Google Cloud Firestore로 마이그레이션했습니다.

**마이그레이션 날짜**: 2025년 1월 6일  
**이유**: 클라우드 네이티브 아키텍처로 전환, 확장성 및 안정성 향상

---

## 🏗️ 아키텍처 변경

### Before (SQLite)
```
FastAPI
  ↓
SQLAlchemy ORM
  ↓
SQLite (로컬 파일 DB)
```

### After (Firestore)
```
FastAPI
  ↓
Firebase Admin SDK
  ↓
Google Cloud Firestore (NoSQL Cloud DB)
```

---

## 🔧 기술 스택

### 새로 추가된 패키지
- `firebase-admin==7.1.0` - Firebase Admin SDK
- `google-cloud-firestore==2.21.0` - Firestore 클라이언트

### 환경 변수
```env
# .env 파일
USE_FIRESTORE=true
FIRESTORE_KEY_PATH=firestore-key.json
```

---

## 📂 파일 구조

### 새로 추가된 Firestore 파일
```
backend/src/
├── firestore_db.py                      # Firestore 초기화 및 연결
├── services/
│   ├── auth_service_firestore.py        # Firestore 인증 서비스
│   └── todo_service_firestore.py        # Firestore Todo CRUD 서비스
└── api/
    ├── auth_firestore.py                # Firestore 인증 API 라우터
    └── todos_firestore.py               # Firestore Todo API 라우터
```

### 기존 SQLite 파일 (백업용 유지)
```
backend/src/
├── database.py                          # SQLite 연결 (사용 안 함)
├── models/                              # SQLAlchemy 모델 (사용 안 함)
│   ├── user.py
│   └── todo.py
├── services/
│   ├── auth_service.py                  # SQLite 인증 (사용 안 함)
│   └── todo_service.py                  # SQLite Todo (사용 안 함)
└── api/
    ├── auth.py                          # SQLite Auth API (사용 안 함)
    └── todos.py                         # SQLite Todo API (사용 안 함)
```

---

## 🗄️ 데이터 모델

### Firestore Collections

#### 1. `users` 컬렉션
```json
{
  "id": "string (문서 ID)",
  "username": "string (unique)",
  "email": "string",
  "hashed_password": "string",
  "created_at": "timestamp"
}
```

#### 2. `todo_lists` 컬렉션
```json
{
  "id": "string (문서 ID)",
  "keyword": "string",
  "user_id": "string (users 참조)",
  "color": "string (hex color)",
  "icon": "string (emoji)",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### 3. `todo_items` 컬렉션
```json
{
  "id": "string (문서 ID)",
  "description": "string",
  "is_completed": "boolean",
  "order": "number",
  "parent_id": "string | null",
  "todo_list_id": "string (todo_lists 참조)",
  "priority": "string ('low' | 'medium' | 'high')",
  "due_date": "timestamp | null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

## 🔍 Firestore 인덱스

### 복합 인덱스 (Composite Indexes)

#### todo_items 컬렉션
```
Collection ID: todo_items
Fields indexed:
  - parent_id (Ascending)
  - todo_list_id (Ascending)
  - order (Ascending)
  - __name__ (Ascending)

용도: 계층 구조 Todo 아이템 조회 (부모-자식 관계)
```

**인덱스 생성 방법**:
1. Firebase Console → Firestore → 인덱스
2. 에러 메시지의 링크 클릭하여 자동 생성
3. 생성 완료까지 1-5분 소요

---

## 🔄 데이터 전환 방법

### Firestore 사용 (현재)
```env
USE_FIRESTORE=true
```

### SQLite로 되돌리기
```env
USE_FIRESTORE=false
```

`main.py`에서 환경 변수에 따라 자동으로 적절한 서비스를 로드합니다.

---

## 🚀 배포 설정

### Google Cloud 프로젝트
- **프로젝트 ID**: `taskgenie-477403`
- **프로젝트 이름**: TaskGenie
- **리전**: `asia-northeast3` (Seoul)
- **데이터베이스**: Firestore Native Mode (Standard)

### 서비스 계정
- **이름**: `taskgenie-firestore`
- **역할**: Cloud Datastore User
- **키 파일**: `backend/firestore-key.json` (gitignore에 추가됨)

### Cloud Run 배포 시 주의사항
1. `firestore-key.json` 파일을 Secret Manager에 저장
2. Cloud Run에서 Secret을 파일로 마운트
3. 환경 변수 `FIRESTORE_KEY_PATH` 설정
4. `USE_FIRESTORE=true` 설정

---

## ⚡ 성능 비교

### SQLite
- ✅ 로컬 파일, 매우 빠름
- ❌ 단일 서버만 가능
- ❌ 동시 쓰기 제한
- ❌ 확장성 없음

### Firestore
- ✅ 자동 스케일링
- ✅ 무제한 동시 접속
- ✅ 실시간 동기화 지원
- ✅ 자동 백업
- ⚠️ 네트워크 지연 (약간 느림)
- ⚠️ 읽기/쓰기 비용 발생

---

## 💰 비용 (무료 할당량)

Firestore Standard Edition:
- **읽기**: 50,000회/일
- **쓰기**: 20,000회/일
- **삭제**: 20,000회/일
- **저장 공간**: 1 GiB

**예상 비용**: 개인 프로젝트는 무료 할당량 내에서 충분히 사용 가능

---

## 🔐 보안

### Firestore Rules (현재 설정)
```javascript
// 제한적 모드 (Deny all by default)
// 서버 측 SDK만 접근 가능
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**이유**: FastAPI 백엔드에서 서비스 계정으로만 접근하므로 웹/모바일 SDK 접근 차단

---

## 🐛 트러블슈팅

### 1. 인덱스 에러
```
FailedPrecondition: 400 The query requires an index
```
**해결**: 에러 메시지의 링크를 클릭하여 인덱스 생성

### 2. 권한 에러
```
PermissionDenied: 403 Permission denied on resource project
```
**해결**: 
- Firestore API 활성화 확인
- 서비스 계정 권한 확인
- `firestore-key.json` 파일 경로 확인

### 3. 연결 에러
```
ModuleNotFoundError: No module named 'firebase_admin'
```
**해결**:
```bash
pip install firebase-admin google-cloud-firestore
```

---

## 📝 주요 차이점

### ID 타입
- **SQLite**: UUID (UUID4 객체)
- **Firestore**: String (UUID 문자열)

### 관계 (Relationships)
- **SQLite**: SQLAlchemy relationships, foreign keys
- **Firestore**: Document references (문서 ID 저장)

### 쿼리
- **SQLite**: SQL, ORM 쿼리
- **Firestore**: NoSQL 쿼리, 필터/정렬

### 트랜잭션
- **SQLite**: DB 세션 관리
- **Firestore**: 자동 트랜잭션, 원자적 작업

---

## 🔄 롤백 계획

Firestore에서 문제 발생 시 SQLite로 되돌리는 방법:

1. `.env` 파일 수정:
```env
USE_FIRESTORE=false
```

2. 서버 재시작:
```bash
cd backend
python -m uvicorn src.main:app --reload
```

3. SQLite DB 파일은 `backend/taskgenie.db`에 그대로 유지됨

---

## ✅ 마이그레이션 체크리스트

- [x] Firebase 프로젝트 생성
- [x] Firestore 데이터베이스 설정
- [x] 서비스 계정 생성 및 키 다운로드
- [x] `firebase-admin` 패키지 설치
- [x] Firestore 초기화 코드 작성
- [x] Auth 서비스 Firestore 버전 작성
- [x] Todo 서비스 Firestore 버전 작성
- [x] API 라우터 Firestore 버전 작성
- [x] 환경 변수 설정
- [x] 복합 인덱스 생성
- [x] 로컬 테스트 완료
- [ ] 프로덕션 배포 (Cloud Run)
- [ ] 데이터 마이그레이션 (필요 시)

---

## 📚 참고 자료

- [Firebase Admin SDK 문서](https://firebase.google.com/docs/admin/setup)
- [Firestore 문서](https://firebase.google.com/docs/firestore)
- [Firestore 보안 규칙](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore 인덱스 관리](https://firebase.google.com/docs/firestore/query-data/indexing)

---

## 👥 담당자

**작성자**: GitHub Copilot  
**검토자**: GOGEON  
**최종 수정일**: 2025년 1월 6일
