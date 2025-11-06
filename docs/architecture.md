# TaskGenie 프로젝트 시스템 구조도

## 1. 개요

본 문서는 `TaskGenie` 프로젝트의 시스템 아키텍처를 설명합니다. 이 시스템은 사용자가 키워드를 입력하면 AI가 할 일 목록(To-Do List)을 자동으로 생성해주고, 사용자는 이를 관리할 수 있는 웹 애플리케이션입니다.

- **Frontend**: React.js (Vite)
- **Backend**: Python (FastAPI)
- **Database**: Google Cloud Firestore (NoSQL)
- **AI**: Google Gemini API
- **Cloud**: Google Cloud Platform

## 2. 아키텍처 다이어그램

```
+-----------------+      +----------------------+      +------------------+
|                 |      |                      |      |                  |
|   Web Browser   |----->|     Frontend         |----->|     Backend      |
| (React Client)  |      |   (React, Vite)      |      |   (FastAPI)      |
|                 |<-----|                      |<-----|                  |
+-----------------+      +----------------------+      +--------+---------+
                                                                 |
                                                                 |
                                            +--------------------+--------------------+
                                            |                                         |
                                  +---------v---------+                  +-----------v-----------+
                                  |                   |                  |                       |
                                  |    Firestore      |                  |    AI Service         |
                                  | (Cloud NoSQL DB)  |                  |  (Google Gemini)      |
                                  |                   |                  |                       |
                                  +-------------------+                  +-----------------------+
                                            |
                                            |
                                  +---------v---------+
                                  |                   |
                                  | Google Cloud      |
                                  | Platform          |
                                  +-------------------+
```

## 3. 구성 요소 상세

### 3.1. Frontend (React Client)

- **역할**: 사용자 인터페이스(UI) 제공 및 사용자 상호작용 처리.
- **주요 기술**: `React.js`, `Vite`, `axios`, `tailwindcss`.
- **주요 기능**:
    - **사용자 인증**: 로그인/회원가입 UI를 제공하고, 인증 토큰(JWT)을 로컬 스토리지에 관리.
    - **키워드 입력**: 사용자가 할 일 목록 생성을 위한 키워드를 입력.
    - **할 일 목록 관리**:
        - AI가 생성한 할 일 목록 및 하위 항목들을 시각적으로 표시.
        - 항목 완료/수정/삭제/순서 변경 기능 제공.
        - 컨텍스트 메뉴를 통해 특정 항목에 대한 세부 기능(하위 항목 생성 등) 요청.
    - **API 통신**: `axios`를 사용하여 백엔드 API와 비동기 통신(HTTP 요청).

### 3.2. Backend (FastAPI Server)

- **역할**: 비즈니스 로직 처리, 데이터베이스 관리, 외부 AI 서비스 연동.
- **주요 기술**: `FastAPI`, `Firebase Admin SDK`, `Pydantic`, `uvicorn`.
- **주요 기능**:
    - **API Endpoints 제공**:
        - `/auth`: JWT 기반 사용자 인증(로그인, 회원가입) 처리.
        - `/todos`: 할 일 목록 및 항목에 대한 CRUD(생성, 조회, 수정, 삭제) 기능 제공.
    - **AI 연동**:
        - `/todos/generate`: 키워드를 받아 `ai_service`를 통해 Gemini API를 호출하고, 생성된 할 일 목록을 Firestore에 저장 후 반환.
        - `/todos/items/{item_id}/generate-subtasks`: 특정 할 일 항목에 대한 세부 항목을 AI로 생성.
    - **서비스 계층**: `auth_service_firestore`, `todo_service_firestore` 등 비즈니스 로직을 API 라우터와 분리하여 관리.
    - **데이터베이스 상호작용**: `Firebase Admin SDK`를 사용하여 Firestore와 통신.

### 3.3. Database (Google Cloud Firestore)

- **역할**: 애플리케이션의 데이터를 클라우드에 영구적으로 저장.
- **특징**:
    - **NoSQL 문서 데이터베이스**: 유연한 스키마, JSON 형식 데이터 저장.
    - **실시간 동기화**: 실시간 리스너 지원 (향후 활용 가능).
    - **자동 스케일링**: 트래픽에 따라 자동으로 확장.
    - **위치**: Seoul 리전 (`asia-northeast3`).
- **저장 데이터 (Collections)**:
    - **users**: 사용자 계정 정보 (username, email, hashed_password).
    - **todo_lists**: 할 일 목록 (keyword, user_id, color, icon).
    - **todo_items**: 할 일 항목 (description, is_completed, order, parent_id, todo_list_id, priority, due_date).
- **인덱스**:
    - `todo_items` 컬렉션: `parent_id`, `todo_list_id`, `order` 복합 인덱스 (계층 구조 쿼리 최적화).

### 3.4. AI Service (Google Gemini)

- **역할**: 자연어 입력을 기반으로 할 일 목록 및 세부 항목을 생성.
- **연동 방식**:
    - 백엔드의 `ai_service` 모듈에서 Google Gemini API(`gemini-flash-latest`)를 호출.
    - 사용자가 입력한 키워드나 상위 할 일 내용을 프롬프트로 구성하여 요청.
    - API 응답 텍스트를 파싱하여 구조화된 할 일 목록으로 변환.

## 4. 주요 데이터 흐름 (예시: 할 일 목록 생성)

1.  **사용자**가 프론트엔드 화면에서 '프로젝트 기획'이라는 키워드를 입력하고 '생성' 버튼을 클릭.
2.  **프론트엔드**는 인증 토큰과 함께 백엔드의 `POST /todos/generate` 엔드포인트로 API 요청을 보냄.
3.  **백엔드**(`todos_firestore` 라우터)는 요청을 받아 `todo_service_firestore`의 `create_todo_list_with_ai_items` 함수를 호출.
4.  `todo_service_firestore`는 `ai_service`의 `generate_todo_items_from_keyword` 함수를 호출.
5.  `ai_service`는 '프로젝트 기획' 키워드를 포함한 프롬프트를 **Google Gemini API**로 전송.
6.  **Gemini API**는 "1. 목표 설정, 2. 시장 조사..." 와 같은 할 일 목록 텍스트를 생성하여 반환.
7.  **백엔드**는 반환된 텍스트를 파싱하여 개별 할 일 항목으로 분리하고, **Google Cloud Firestore**에 새로운 할 일 목록과 항목들을 저장.
8.  **백엔드**는 저장된 전체 할 일 목록 데이터를 JSON 형식으로 **프론트엔드**에 응답.
9.  **프론트엔드**는 수신한 데이터를 상태(state)에 저장하고, 화면에 새로운 할 일 목록을 렌더링하여 **사용자**에게 보여줌.

## 5. 클라우드 아키텍처 특징

### 5.1. Firestore 장점
- **확장성**: 자동 스케일링, 무제한 동시 접속 지원
- **안정성**: 99.99% 가용성 SLA
- **실시간**: 실시간 데이터 동기화 지원 (향후 구현 가능)
- **글로벌**: 전 세계 CDN을 통한 빠른 응답

### 5.2. 보안
- **서비스 계정**: Firebase Admin SDK를 통한 서버 측 인증
- **Firestore Rules**: 클라이언트 직접 접근 차단 (deny all)
- **JWT**: 사용자 인증 및 권한 관리

### 5.3. 배포 준비
- **Cloud Run**: 서버리스 컨테이너 배포 가능
- **자동 스케일링**: 트래픽에 따른 인스턴스 자동 조절
- **비용 효율**: 사용한 만큼만 과금

## 6. 관련 문서

- **[Firestore 마이그레이션 가이드](./FIRESTORE_MIGRATION.md)** - SQLite → Firestore 전환 상세 내역
- **[코드 변경 사항](./CODE_CHANGES_SUMMARY.md)** - 기능 추가 및 변경 내역
- **[개선 제안](./IMPROVEMENT_SUGGESTIONS.md)** - 향후 로드맵
