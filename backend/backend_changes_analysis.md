# [TaskGenie] UI 설계서 vs 백엔드 구현 차이점 분석

본 문서는 초기 UI 설계서([TP–2] UI 설계서)와 실제 구현된 백엔드 코드(`backend/`) 간의 기능적, 구조적 차이점을 기술합니다.

## 1. 시스템 아키텍처 및 데이터베이스 변경

가장 큰 변화는 로컬 데이터베이스(SQLite)에서 클라우드 기반 NoSQL 데이터베이스(Firestore)로의 전환입니다.

| 구분 | UI 설계서 (TP-2) | 백엔드 코드 구현 (`backend/`) |
| :--- | :--- | :--- |
| **DB 구조** | 로컬 스토리지 및 관계형 DB (SQLite) 암시 | **Google Cloud Firestore (NoSQL) 도입** |
| **데이터 처리** | 일반적인 SQL 쿼리 처리 방식 | 컬렉션/도큐먼트 기반 처리 및 **재귀적 트리 구조 빌드 로직** 적용 |
| **관련 파일** | - | `src/firestore_db.py`, `src/services/todo_service_firestore.py` |

**변경 상세:**
*   `backend/.env` 및 `main.py`에서 `USE_FIRESTORE=true` 플래그를 통해 Firestore 모드로 동작하도록 구현되었습니다.
*   관계형 테이블 대신 `users`, `todo_lists`, `todo_items` 컬렉션을 사용하는 NoSQL 구조로 변경되었습니다.

## 2. 사용자 인증 프로세스 확장

설계서에는 기본적인 ID/PW 로그인만 명시되어 있으나, 실제 구현에는 다양한 소셜 로그인이 추가되었습니다.

| 구분 | UI 설계서 (TP-2) | 백엔드 코드 구현 (`backend/`) |
| :--- | :--- | :--- |
| **로그인 방식** | ID/비밀번호 기반 일반 로그인 | 일반 로그인 + **Google, Naver, Kakao 소셜 로그인 추가** |
| **인증 처리** | JWT 토큰 발급 및 검증 | **OAuth 2.0 인증 흐름 처리** 및 Firebase Auth 연동 |
| **관련 파일** | 프로세스 정의서 6-3 | `src/api/auth_firestore.py`, `src/schemas.py` |

**구현 코드 증거 (`src/api/auth_firestore.py`):**
```python
@router.post("/social-login", response_model=Token)
def social_login(social_login_req: SocialLoginRequest): ...

@router.post("/naver-callback", response_model=Token)
def naver_callback(callback_req: NaverCallbackRequest): ...

@router.post("/kakao-callback", response_model=Token)
def kakao_callback(callback_req: KakaoCallbackRequest): ...
```

## 3. AI 할 일 생성 및 처리 고도화

설계서의 단순 키워드 기반 생성을 넘어, 자연어 처리(NLP)를 통한 세부 속성 추출 기능이 추가되었습니다.

| 구분 | UI 설계서 (TP-2) | 백엔드 코드 구현 (`backend/`) |
| :--- | :--- | :--- |
| **입력 방식** | 단순 키워드 입력 (예: "중간고사 준비") | 키워드 입력 + **자연어 문장 파싱** (예: "내일 5시까지 과제 제출") |
| **데이터 속성** | 내용(Description), 완료여부, 하위항목 | **우선순위(Priority), 마감일(Due Date), 예상 소요시간** 추가 추출 |
| **생성 로직** | Gemini API 호출 후 목록 생성 | Gemini API를 통한 **구조적 파싱(`analyze_task_from_natural_language`)** 추가 |
| **관련 파일** | 프로세스 정의서 6-3 (AI 처리) | `src/services/ai_service.py`, `src/services/nlp_parser.py` |

**구현 코드 증거 (`src/services/ai_service.py`):**
```python
def analyze_task_from_natural_language(natural_language_text: str) -> dict:
    # ...
    # Prompt implies extraction of description, due_date, priority, etc.
    prompt = f"""You are a sophisticated task parser...
    1. `description`: ...
    2. `due_date`: ...
    3. `priority`: ...
    """
```

## 4. 데이터 모델 (Schema) 확장

설계서에 명시되지 않았던 메타 데이터 필드들이 할 일 항목 관리의 효율성을 위해 추가되었습니다.

| 구분 | UI 설계서 (TP-2) | 백엔드 코드 구현 (`backend/`) |
| :--- | :--- | :--- |
| **할 일 항목** | 내용, 완료 여부, 순서, 하위 항목 | **우선순위(priority), 마감일(due_date), 알림 시간(reminder_date)** 추가 |
| **프로젝트** | 프로젝트 목록 | **프로젝트 색상(color), 아이콘(icon)** 필드 추가 |
| **관련 파일** | - | `src/schemas.py` |

**구현 코드 증거 (`src/schemas.py`):**
```python
class ToDoItemBase(BaseModel):
    description: str
    is_completed: bool = False
    order: int
    priority: str = 'none'  # 설계서에 없던 필드
    due_date: Optional[datetime] = None  # 설계서에 없던 필드
```

## 5. 요약

UI 설계서는 시스템의 기본적인 뼈대와 흐름을 정의했으나, 실제 백엔드 개발 과정에서 **사용자 편의성(소셜 로그인, 자연어 입력)**과 **시스템 확장성(Firestore, 메타데이터 확장)**을 위해 기능이 대폭 확장 구현되었습니다.

*   **DB:** SQLite → Firestore (Cloud Native)
*   **Auth:** ID/PW → Social Login (OAuth)
*   **Features:** 단순 생성 → 자연어 파싱(NLP) 및 마감일/우선순위 관리
