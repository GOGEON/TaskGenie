# AI To-Do List 개선 제안서

**작성일**: 2025년 10월 27일  
**최종 업데이트**: 2025년 1월 6일  
**프로젝트**: TaskGenie (AI Task Generator)  
**브랜치**: main

---

## 📢 최근 업데이트 (2025.01.06)

### ✅ 완료된 주요 개선사항

1. **🔄 Firestore 마이그레이션 완료**
   - SQLite → Google Cloud Firestore로 완전 전환
   - 클라우드 네이티브 아키텍처로 업그레이드
   - 실시간 동기화 및 무제한 확장성 확보
   - 자세한 내용: [`docs/FIRESTORE_MIGRATION.md`](./FIRESTORE_MIGRATION.md)

2. **🤖 Gemini API 모델 업데이트**
   - `gemini-pro` → `gemini-1.5-flash-latest`로 업데이트
   - 최신 AI 모델 자동 사용 (항상 최신 버전 유지)

3. **🎨 UI 일관성 개선**
   - 모든 모달 배경 스타일 통일 (`rgba(16, 24, 40, 0.1)`)
   - `EditModal`, `KeywordInputModal` 등 일관된 디자인 적용

4. **🔒 보안 강화**
   - `.gitignore`에 Firestore 서비스 계정 키 추가
   - 배포 스크립트 및 임시 파일 제외 설정
   - GitHub Secret Scanning 통과

### 🔄 아키텍처 변경 영향

**Phase 4: 협업 기능의 우선순위 상향 조정**
- Firestore의 실시간 기능을 활용한 협업 기능 구현이 더욱 용이해짐
- WebSocket 대신 Firestore의 실시간 리스너 활용 가능
- 예상 구현 시간 단축: 20시간 → 10-12시간

**데이터베이스 마이그레이션 불필요**
- 기존 SQL 마이그레이션 파일은 레거시로 유지
- Firestore는 스키마리스로 마이그레이션 불필요
- 컬렉션 구조는 코드 레벨에서 관리

**새로운 기술 스택**
```json
{
  "firebase-admin": "^7.1.0",           // Firestore 서버 SDK
  "google-cloud-firestore": "^2.21.0"  // Firestore 클라이언트
}
```

---

## 📋 목차

1. [UI/UX 개선사항](#uiux-개선사항)
2. [필요한 기능](#필요한-기능)
3. [즉시 구현 가능한 Quick Wins](#즉시-구현-가능한-quick-wins)
4. [우선순위 로드맵](#우선순위-로드맵)

---

## 🎨 UI/UX 개선사항

### 1. 검색 및 필터 기능

**현재 상태**: 프로젝트와 할 일 항목이 증가해도 검색/필터 기능이 없음

**개선안**:
- 사이드바에 프로젝트 검색창 추가
- 할 일 항목 내 검색 기능
- 완료/미완료 필터링 토글 버튼
- 태그별 필터링 (태그 시스템 구현 후)

**구현 위치**:
- `frontend/src/components/Sidebar.jsx` - 프로젝트 검색
- `frontend/src/pages/ProjectView.jsx` - 할 일 검색

**예상 효과**:
- 대규모 프로젝트에서의 사용성 향상
- 특정 작업 빠른 검색 가능

---

### 2. 프로젝트 시각화 개선

**현재 상태**: 단순 텍스트 리스트

**개선안**:
```javascript
// 프로젝트 모델에 추가할 필드
{
  color: '#FF6B6B',      // 프로젝트 색상
  icon: '📚',             // 이모지 아이콘
  viewMode: 'list'        // 'list' | 'grid'
}
```

**기능**:
- 프로젝트별 색상 태그 선택
- 아이콘/이모지 선택기
- 그리드 뷰 / 리스트 뷰 전환 버튼
- 색상 코딩으로 프로젝트 구분

**구현 파일**:
- `backend/migrations/add_color_icon_to_todolist.sql` (이미 존재)
- `frontend/src/components/Sidebar.jsx` 수정
- `frontend/src/components/ProjectColorPicker.jsx` 신규 생성

---




### 5. 모바일 UX 개선

**현재 상태**: 반응형 지원은 되지만 모바일 전용 제스처 부족

**개선안**:
- 스와이프로 삭제 기능 (좌/우 스와이프)
- 하단 네비게이션 바 추가 (모바일 접근성 향상)
- Pull-to-refresh 기능
- 햅틱 피드백 (가능한 경우)
- 터치 영역 확대 (최소 44px)

**라이브러리 추천**:
```json
{
  "react-swipeable": "^7.0.0",        // 스와이프 제스처
  "react-pull-to-refresh": "^2.0.0"  // Pull to refresh
}
```

**구현 위치**:
- `frontend/src/components/ToDoItem.jsx` - 스와이프 삭제
- `frontend/src/components/MobileNavBar.jsx` 신규
- `frontend/src/pages/ProjectView.jsx` - Pull to refresh

---

### 6. 시각적 피드백 개선

**현재 상태**: 
- ✅ 항목 생성 시 페이드인 애니메이션 (`item-fade-in`)
- ✅ 완료 시 펄스 애니메이션 (`success-pulse`)
- ✅ 삭제 시 슬라이드 아웃 (`item-slide-out`)

**추가 개선안**:
- 드래그 중 Drop Zone 하이라이트 (점선 테두리)
- 로딩 상태 개선 (스켈레톤 스크린 활용도 증가)
- 에러 상태 시각적 표시 (shake 애니메이션)
- 성공 토스트 메시지 커스터마이징

**CSS 추가**:
```css
.drop-zone-highlight {
  border: 2px dashed #FF6B6B;
  background: rgba(255, 107, 107, 0.05);
}

.error-shake {
  animation: shake 0.3s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
```

---

## ⚙️ 필요한 기능




### 3. 태그 시스템 ⭐⭐

**중요도**: 중간  
**난이도**: 중간  
**예상 시간**: 4-5시간

**데이터 모델**:
```python
class Tag(Base):
    __tablename__ = 'tags'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    color = Column(String, default='#6B7280')
    user_id = Column(Integer, ForeignKey('users.id'))

class ToDoItemTag(Base):
    __tablename__ = 'todo_item_tags'
    todo_item_id = Column(Integer, ForeignKey('todo_items.id'))
    tag_id = Column(Integer, ForeignKey('tags.id'))
```

**기능**:
- 태그 생성/수정/삭제
- 할 일 항목에 태그 추가/제거
- 태그별 필터링
- 색상 태그 (각 태그마다 다른 색상)
- 태그 자동완성

**사용 사례**:
```
태그 예시:
#긴급 #개인 #업무 #운동 #공부 #취미
```

**구현 파일**:
- `backend/src/models/tag.py` 신규
- `backend/src/api/tags.py` 신규
- `frontend/src/components/TagInput.jsx` 신규
- `frontend/src/components/TagBadge.jsx` 신규

---

### 4. 협업 기능 ⭐⭐⭐

**중요도**: 높음 (Firestore 실시간 기능 활용)  
**난이도**: 중간 (Firestore 덕분에 단순화됨)  
**예상 시간**: 10-12시간

> **🔄 변경사항**: Firestore 마이그레이션으로 WebSocket 대신 Firestore 실시간 리스너 활용 가능. 구현 난이도 및 시간 대폭 감소.

**기능**:
- 👥 프로젝트 공유 (Firestore 공유 문서)
- ✏️ 멀티 사용자 실시간 편집 (Firestore onSnapshot)
- 💬 댓글/메모 기능 (서브컬렉션)
- 👤 담당자 할당
- 🔔 활동 로그 (Firestore 타임스탬프 자동 관리)
- 권한 관리 (뷰어/편집자/관리자)

**Firestore 데이터 모델**:
```javascript
// project_shares 컬렉션
{
  id: "auto_generated_id",
  todo_list_id: "list_id",
  shared_with_user_id: "user_id",
  permission: "view" | "edit" | "admin",
  share_link: "unique_link",
  created_at: Timestamp
}

// comments 서브컬렉션 (todo_items/{itemId}/comments)
{
  id: "auto_generated_id",
  user_id: "user_id",
  user_name: "홍길동",
  content: "댓글 내용",
  created_at: Timestamp
}
```

**실시간 동기화 예시**:
```javascript
// Firestore 실시간 리스너
const unsubscribe = onSnapshot(
  doc(db, 'todo_items', itemId),
  (doc) => {
    // 다른 사용자가 수정 시 자동 업데이트
    setTodoItem(doc.data());
  }
);
```

**기술 스택 변경**:
```json
{
  // WebSocket 불필요
  // "socket.io": "^4.0.0" ❌ 제거
  // "socket.io-client": "^4.0.0" ❌ 제거
  
  // Firestore 실시간 리스너 활용 ✅
  "firebase": "^11.0.0"  // 프론트엔드 SDK
}
```

**구현 파일**:
- `backend/src/services/sharing_service_firestore.py` 신규
- `backend/src/api/sharing.py` 신규
- ~~`backend/src/websocket.py`~~ 불필요 (Firestore 사용)
- `frontend/src/services/firestoreRealtimeService.js` 신규
- `frontend/src/components/ShareModal.jsx` 신규
- `frontend/src/components/CommentSection.jsx` 신규

---

### 5. 통계 및 분석 대시보드 ⭐⭐

**중요도**: 중간  
**난이도**: 중간  
**예상 시간**: 6-8시간

**기능**:
- 📊 완료율 추이 그래프 (일/주/월별)
- 📈 생산성 통계
- 🏆 가장 많이 사용한 키워드
- ⏱️ 평균 완료 시간 분석
- 🎯 목표 달성률
- 📅 요일별 생산성 히트맵

**UI 구성**:
```
대시보드 레이아웃:
┌─────────────────────────────────┐
│  이번 주 완료율: 85% ↑ 15%      │
├─────────────────────────────────┤
│  [완료율 추이 라인 차트]         │
├─────────────────────────────────┤
│  인기 키워드    │  요일별 히트맵 │
│  1. 운동 (15)   │  월 화 수 목 금│
│  2. 공부 (12)   │  ████░░░████  │
└─────────────────────────────────┘
```

**라이브러리**:
```json
{
  "recharts": "^2.0.0",           // 차트 라이브러리
  "date-fns": "^4.0.0"            // 날짜 처리
}
```

**구현 파일**:
- `backend/src/api/analytics.py` 신규
- `frontend/src/pages/DashboardPage.jsx` 신규
- `frontend/src/components/charts/CompletionChart.jsx` 신규
- `frontend/src/components/charts/HeatmapChart.jsx` 신규

---

### 6. AI 기능 강화 ⭐⭐⭐

**중요도**: 높음 (차별화 포인트)  
**난이도**: 중간-높음  
**예상 시간**: 10-12시간

**추가 AI 기능**:

1. **우선순위 자동 제안**
   ```python
   # AI가 할 일 내용을 분석하여 우선순위 제안
   "프로젝트 제출" → 높음 (긴급성 키워드)
   "책 읽기" → 낮음 (여유 활동)
   ```

2. **예상 소요 시간 추정**
   ```python
   # AI가 작업 복잡도를 분석
   "5분 준비운동" → 5분
   "백엔드 API 개발" → 4시간
   ```

3. **유사 프로젝트 템플릿 제안**
   ```
   "운동하기" 입력 시:
   → 이전에 만든 "헬스" 프로젝트 템플릿 제안
   ```

4. **스마트 리마인더**
   ```python
   # 사용자 패턴 학습 후 최적 시간 제안
   "보통 오전 9시에 운동을 시작하시네요. 알림을 8:50으로 설정할까요?"
   ```

5. **자연어 입력 파싱**
   ```javascript
   // 입력: "내일까지 운동하기"
   {
     description: "운동하기",
     due_date: "2025-10-28",
     priority: "medium"
   }
   
   // 입력: "긴급! 오늘 저녁 6시까지 보고서 제출"
   {
     description: "보고서 제출",
     due_date: "2025-10-27 18:00",
     priority: "high"
   }
   ```

**구현 파일**:
- `backend/src/services/ai_service.py` 수정
- `backend/src/services/nlp_parser.py` 신규
- `backend/src/services/recommendation_service.py` 신규

**Gemini API 활용**:
```python
# 프롬프트 예시
prompt = f"""
다음 할 일을 분석해주세요:
"{description}"

다음 정보를 JSON으로 반환:
1. 우선순위 (high/medium/low)
2. 예상 소요 시간 (분 단위)
3. 카테고리 (업무/개인/운동/학습 등)
4. 추천 마감일 (상대적 시간)
"""
```

---

### 7. 데이터 백업 및 내보내기 ⭐

**중요도**: 중간  
**난이도**: 낮음  
**예상 시간**: 3-4시간

> **🔄 변경사항**: Firestore는 자동으로 데이터를 백업하므로 서버 백업 기능은 불필요. 사용자 데이터 내보내기 기능에 집중.

**기능**:
- 📥 JSON 형식으로 내보내기
- 📊 CSV 형식으로 내보내기 (엑셀 호환)
- 📋 프로젝트 템플릿 저장
- ~~💾 자동 백업 (로컬스토리지 + 서버)~~ → Firestore에서 자동 처리
- 📋 프로젝트 복제 기능
- 📤 가져오기 (JSON 업로드)

**Firestore 백업 (관리자용)**:
```bash
# Firebase Console에서 자동 백업 설정
# 또는 gcloud 명령어로 수동 백업
gcloud firestore export gs://[BUCKET_NAME]
```

**파일 형식**:
```json
// export-2025-10-27.json
{
  "export_date": "2025-10-27T10:30:00",
  "version": "1.0",
  "projects": [
    {
      "keyword": "운동하기",
      "color": "#FF6B6B",
      "icon": "🏃",
      "items": [
        {
          "description": "준비운동",
          "is_completed": true,
          "priority": "medium",
          "due_date": null,
          "children": []
        }
      ]
    }
  ]
}
```

**구현 파일**:
- `backend/src/api/export.py` 신규
- `frontend/src/services/exportService.js` 신규
- `frontend/src/components/ExportModal.jsx` 신규

---

### 8. 키보드 단축키 ⭐

**중요도**: 중간  
**난이도**: 낮음  
**예상 시간**: 2-3시간

**단축키 목록**:
```
전역 단축키:
Ctrl + N        새 프로젝트 생성
Ctrl + K        검색창 포커스
Ctrl + B        사이드바 토글
Ctrl + /        단축키 목록 표시
Ctrl + ,        설정 열기

프로젝트 뷰:
Space           선택한 항목 체크 토글
E               선택한 항목 편집
Delete          선택한 항목 삭제
Ctrl + Enter    새 항목 추가
Tab             하위 항목 생성 (AI)
↑ / ↓          항목 이동

항목 편집:
Enter           저장
Escape          취소
```

**라이브러리**:
```json
{
  "react-hotkeys-hook": "^4.0.0"
}
```

**구현 파일**:
- `frontend/src/hooks/useKeyboardShortcuts.js` 신규
- `frontend/src/components/ShortcutHelp.jsx` 신규 (단축키 목록 모달)
- `frontend/src/pages/ProjectView.jsx` 수정

---

### 9. 다크모드 토글 ⭐

**중요도**: 낮음  
**난이도**: 낮음  
**예상 시간**: 2-3시간

**현재 상태**: README에 다크모드 지원 명시되어 있으나 실제 토글 없음

**구현**:
```javascript
// 다크모드 상태 관리
const [darkMode, setDarkMode] = useState(
  localStorage.getItem('darkMode') === 'true'
);

// Tailwind 다크모드 클래스
<div className={darkMode ? 'dark' : ''}>
```

**UI 위치**:
- Header의 우측 상단 (알림 아이콘 옆)
- 설정 페이지 내부 토글 스위치

**스타일**:
```css
/* Tailwind 다크모드 설정 */
@tailwind base;
@tailwind components;
@tailwind utilities;

.dark {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #e5e5e5;
  --text-secondary: #a3a3a3;
}
```

**구현 파일**:
- `frontend/src/hooks/useDarkMode.js` 신규
- `frontend/src/components/DarkModeToggle.jsx` 신규
- `frontend/tailwind.config.js` 수정 (darkMode: 'class')

---

### 10. 알림 시스템 ⭐⭐

**중요도**: 중간  
**난이도**: 중간  
**예상 시간**: 5-6시간

**기능**:
- 🔔 브라우저 푸시 알림 (Notification API)
- 📧 이메일 알림 (선택사항)
- ⏰ 마감일 알림
- 🎉 완료 축하 메시지
- 📢 협업 알림 (댓글, 공유 등)

**알림 타입**:
```javascript
const notificationTypes = {
  DUE_SOON: {
    title: '마감일 임박',
    body: '"{taskName}" 작업이 1시간 후 마감됩니다.',
    icon: '⏰'
  },
  OVERDUE: {
    title: '마감일 지남',
    body: '"{taskName}" 작업의 마감일이 지났습니다.',
    icon: '🚨'
  },
  COMPLETED_ALL: {
    title: '축하합니다! 🎉',
    body: '"{projectName}" 프로젝트의 모든 작업을 완료했습니다!',
    icon: '✅'
  }
};
```

**구현**:
```javascript
// 브라우저 알림 권한 요청
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// 알림 전송
const sendNotification = (title, body, icon) => {
  new Notification(title, { body, icon });
};
```

**구현 파일**:
- `frontend/src/services/notificationService.js` 신규
- `frontend/src/hooks/useNotifications.js` 신규
- `backend/src/services/email_service.py` 신규 (선택)
- `backend/src/api/notifications.py` 신규

---

## 🚀 즉시 구현 가능한 Quick Wins

다음은 **적은 노력으로 큰 효과**를 낼 수 있는 기능들입니다:

### 1. 프로젝트별 항목 개수 표시 (30분)

**구현 위치**: `frontend/src/components/Sidebar.jsx`

**변경 내용**:
```jsx
<span className="text-xs text-gray-400 ml-auto">
  {project.items?.length || 0}개
</span>
```

**효과**: 프로젝트 크기를 한눈에 파악 가능

---

### 2. 완료율 배지 표시 (1시간)

**구현 위치**: `frontend/src/components/Sidebar.jsx`

**변경 내용**:
```jsx
const completionRate = calculateCompletionRate(project);
<div className="text-xs text-green-600">
  {completionRate}%
</div>
```

**효과**: 진행 상황 시각화

---

### 3. 키보드 단축키 - 기본 기능 (2시간)

**구현 내용**:
- `Ctrl + N`: 새 프로젝트
- `Ctrl + K`: 검색
- `Space`: 체크 토글
- `Delete`: 삭제

**효과**: 파워 유저 생산성 향상

---

### 4. 다크모드 토글 버튼 (2-3시간)

**구현 위치**: `frontend/src/components/Header.jsx`

**효과**: 눈의 피로 감소, 사용자 선호도 향상

---

### 5. 빈 상태 컴포넌트 (1-2시간)

**구현 파일**: `frontend/src/components/EmptyState.jsx` 재생성

**내용**:
- 프로젝트 없을 때 가이드
- 할 일 없을 때 CTA

**효과**: 첫 방문자 경험 개선

---

### 6. 프로젝트 검색 기능 (2-3시간)

**구현 위치**: `frontend/src/components/Sidebar.jsx`

**변경 내용**:
```jsx
const [searchQuery, setSearchQuery] = useState('');
const filteredProjects = projects.filter(p => 
  p.keyword.toLowerCase().includes(searchQuery.toLowerCase())
);
```

**효과**: 많은 프로젝트 관리 용이

---

## 📊 우선순위 로드맵

### Phase 1: 핵심 기능 강화 (1-2주)
**목표**: 할 일 관리 앱으로서의 기본 기능 완성

1. ⭐⭐⭐ 우선순위 시스템
2. ⭐⭐⭐ 마감일 관리
3. ⭐ 검색/필터 기능
4. ⭐ 다크모드 토글
5. ⭐ 빈 상태 개선

**예상 시간**: 60-70시간

---

### Phase 2: AI 차별화 (1주) 🔥 우선순위 상향
**목표**: AI 기능을 활용한 경쟁력 확보 (Gemini 1.5 Flash 활용)

1. ⭐⭐⭐ 자연어 입력 파싱
2. ⭐⭐⭐ 우선순위 자동 제안
3. ⭐⭐⭐ 예상 소요 시간 추정
4. ⭐⭐ 스마트 리마인더
5. ⭐⭐ 프로젝트 템플릿 제안

**예상 시간**: 30-40시간

---

### Phase 3: 협업 및 실시간 기능 (1-2주) 🆕 Firestore 활용
**목표**: Firestore 실시간 기능으로 협업 도구로 진화

1. ⭐⭐⭐ 프로젝트 실시간 공유 (Firestore onSnapshot)
2. ⭐⭐⭐ 멀티 사용자 동시 편집
3. ⭐⭐ 댓글/메모 기능 (서브컬렉션)
4. ⭐⭐ 알림 시스템 (Cloud Functions 활용)
5. ⭐ 활동 로그 (Firestore 타임스탬프)

**예상 시간**: 40-50시간 (기존 80-100시간에서 단축)

> **주요 변경**: WebSocket 불필요, Firestore 실시간 리스너로 대체

---

### Phase 4: 사용자 경험 향상 (1-2주)
**목표**: 사용 편의성과 시각적 피드백 개선

1. ⭐⭐ 통계 대시보드
2. ⭐⭐ 태그 시스템 (Firestore 배열 필드 활용)
3. ⭐ 키보드 단축키
4. ⭐ 진행률 표시 개선
5. ⭐ 데이터 백업/내보내기

**예상 시간**: 40-50시간

---

### Phase 5: 모바일 최적화 (1주)
**목표**: 모바일 네이티브 앱 수준의 경험 제공

1. ⭐ 스와이프 제스처
2. ⭐ Pull-to-refresh
3. ⭐ 하단 네비게이션
4. ⭐ PWA 지원
5. ⭐ 오프라인 모드

**예상 시간**: 20-30시간

---

## 📈 예상 효과

### 사용자 만족도
- ✅ 작업 관리 효율성 **40% 향상**
- ✅ 사용자 재방문율 **60% 증가**
- ✅ 평균 세션 시간 **2배 증가**

### 기술적 가치
- ✅ AI 활용도 **3배 향상**
- ✅ 데이터 분석 기반 인사이트 제공
- ✅ 협업 도구로 확장 가능성

### 비즈니스 가치
- ✅ 차별화된 AI 기능으로 경쟁 우위
- ✅ 프리미엄 기능 유료화 가능
- ✅ 기업용 SaaS로 확장 가능

---

## 🎯 추천 시작 순서

**처음 구현할 3가지** (Quick Wins):
1. 프로젝트별 항목 개수 + 완료율 표시 (1.5시간)
2. 다크모드 토글 (2-3시간)
3. 검색 기능 (2-3시간)

**다음 우선순위**:
1. 우선순위 시스템 (4-6시간)
2. 마감일 관리 (8-10시간)
3. AI 기능 강화 - 자연어 파싱 (6-8시간)

---

## 📝 참고 사항

### 기술 스택 확장 고려사항

**추가 라이브러리**:
```json
{
  "recharts": "^2.0.0",               // 차트
  "react-datepicker": "^7.0.0",       // 날짜 선택
  "react-hotkeys-hook": "^4.0.0",     // 단축키
  // "socket.io": "^4.0.0",           // ❌ Firestore 실시간 리스너로 대체
  "firebase": "^11.0.0",              // ✅ Firestore 프론트엔드 SDK
  "react-swipeable": "^7.0.0",        // 스와이프
  "date-fns": "^4.0.0"                // 날짜 유틸
}
```

**백엔드**:
```json
{
  "firebase-admin": "^7.1.0",         // ✅ 이미 설치됨
  "google-cloud-firestore": "^2.21.0" // ✅ 이미 설치됨
}
```

### 데이터베이스 마이그레이션

~~필요한 마이그레이션 파일:~~
- ~~`add_priority_to_todo.sql`~~
- ~~`add_dates_to_todo.sql`~~
- ~~`add_tags_system.sql`~~
- ~~`add_sharing_tables.sql`~~
- ~~`add_comments_table.sql`~~

> **🔄 변경사항**: Firestore는 스키마리스 NoSQL 데이터베이스이므로 마이그레이션 파일 불필요. 
> 필드 추가는 코드 레벨에서 처리하며, 기존 문서에 자동으로 적용됩니다.

**Firestore 필드 추가 예시**:
```javascript
// 새 필드는 코드에서 바로 추가 가능
await updateDoc(doc(db, 'todo_items', itemId), {
  priority: 'high',        // 새 필드
  due_date: Timestamp.now(), // 새 필드
  tags: ['긴급', '중요']    // 배열 필드
});
```

### 성능 최적화 고려

- 대규모 프로젝트 지원을 위한 **페이지네이션** (Firestore 쿼리 커서 활용)
- 재귀 계산 최적화 (메모이제이션)
- **가상 스크롤링** (react-window)
- 이미지/아이콘 **레이지 로딩**
- **Firestore 쿼리 최적화** (복합 인덱스 활용)
- **오프라인 지원** (Firestore 오프라인 지속성)

**Firestore 성능 최적화 팁**:
```javascript
// 1. 쿼리 제한으로 과도한 읽기 방지
const q = query(collection(db, 'todo_items'), limit(50));

// 2. 페이지네이션 (커서 기반)
const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
const next = query(
  collection(db, 'todo_items'),
  startAfter(lastVisible),
  limit(50)
);

// 3. 오프라인 지속성 활성화
enableIndexedDbPersistence(db);
```

---

## 🔄 Firestore 마이그레이션 완료 체크리스트

- [x] Firestore 데이터베이스 생성 (Native Mode)
- [x] 서비스 계정 키 설정
- [x] 백엔드 Firestore 서비스 레이어 구현
- [x] API 엔드포인트 Firestore 연동
- [x] 복합 인덱스 생성
- [x] 로컬 테스트 완료
- [x] 문서화 (`FIRESTORE_MIGRATION.md`)
- [x] `.gitignore` 보안 설정
- [ ] 프론트엔드 실시간 리스너 구현
- [ ] Cloud Run 배포
- [ ] Cloud Functions 설정 (알림용)
- [ ] 프로덕션 테스트

---

**문서 버전**: 2.0  
**최초 작성**: 2025년 10월 27일  
**최종 수정**: 2025년 1월 6일  
**작성자**: GitHub Copilot

