# 코드 변경 사항 요약

> 이 문서는 스크린샷에 나타난 원본 상태에서 현재 상태까지의 모든 변경 사항을 정리합니다.

## 📋 목차

1. [주요 기능 추가](#주요-기능-추가)
2. [UI/UX 개선](#uiux-개선)
3. [백엔드 변경사항](#백엔드-변경사항)
4. [프론트엔드 변경사항](#프론트엔드-변경사항)
5. [새로 추가된 컴포넌트](#새로-추가된-컴포넌트)

---

## 🎯 주요 기능 추가

### 1. **우선순위 시스템** (Priority System)

**목적**: 할 일 항목의 중요도를 4단계로 관리

**구현 내용**:
- **4단계 우선순위**: 없음(none), 낮음(low), 보통(medium), 높음(high)
- **시각적 표시**: 왼쪽 테두리 색상으로 구분
  - 없음: 회색 (`border-l-gray-200`)
  - 낮음: 진한 회색 (`border-l-gray-400`)
  - 보통: 주황색 (`border-l-orange-500`)
  - 높음: 빨간색 (`border-l-red-500`)
- **통합 UI**: 케밥 메뉴(⋮) 내 우선순위 선택 섹션

**관련 파일**:
- `backend/src/models/todo.py` - `priority` 컬럼 추가
- `backend/src/schemas.py` - `ToDoItemBase`에 priority 필드
- `backend/migrations/add_priority_to_todo.sql` - 마이그레이션
- `frontend/src/components/PrioritySelector.jsx` - 선택 UI 컴포넌트
- `frontend/src/components/ToDoItem.jsx` - 테두리 색상 적용
- `frontend/src/components/ContextMenu.jsx` - 메뉴 통합

**데이터베이스**:
```sql
ALTER TABLE todo_items ADD COLUMN priority VARCHAR DEFAULT 'none';
CREATE INDEX idx_todo_items_priority ON todo_items (priority);
UPDATE todo_items SET priority = 'none' WHERE priority IS NULL;
```

---

### 2. **마감일 관리** (Due Date Management)

**목적**: 할 일 항목의 마감 시한을 설정하고 시각적으로 표시

**구현 내용**:
- **날짜/시간 입력**: HTML5 `datetime-local` input 사용
- **색상 코드 배지**:
  - 🔴 빨강: 마감일 지남 (`bg-red-100 text-red-700`)
  - 🟠 주황: 24시간 이내 (`bg-orange-100 text-orange-700`)
  - 🔵 파랑: 여유 있음 (`bg-blue-100 text-blue-700`)
- **ISO 8601 형식**: 타임존을 고려한 시간 저장
- **날짜 제거 기능**: ✕ 버튼으로 마감일 해제 가능

**관련 파일**:
- `backend/src/models/todo.py` - `due_date`, `reminder_date` 컬럼
- `backend/src/schemas.py` - datetime 필드 추가
- `backend/migrations/add_dates_to_todo.sql` - 마이그레이션
- `frontend/src/components/DateTimePicker.jsx` - 날짜 선택 UI
- `frontend/src/components/ToDoItem.jsx` - 배지 표시
- `frontend/src/components/ContextMenu.jsx` - 메뉴 통합

**데이터베이스**:
```sql
ALTER TABLE todo_items ADD COLUMN due_date DATETIME NULL;
ALTER TABLE todo_items ADD COLUMN reminder_date DATETIME NULL;
CREATE INDEX idx_todo_items_due_date ON todo_items (due_date);
```

---

### 3. **가중치 기반 진행률 계산** (Weighted Progress)

**목적**: 계층 구조를 정확히 반영하는 진행률 측정

**이전 방식**: 단순 카운트
```javascript
// 완료된 항목 수 / 전체 항목 수 * 100
const progress = (completedCount / totalCount) * 100;
```

**현재 방식**: 재귀적 가중치
```javascript
const calculateRecursiveProgress = (items) => {
  if (!items || items.length === 0) return 100;
  
  let totalProgress = 0;
  const weightPerItem = 100 / items.length; // 각 항목이 동등한 비중
  
  items.forEach(item => {
    if (item.children && item.children.length > 0) {
      // 자식의 진행률을 재귀적으로 계산
      totalProgress += (calculateRecursiveProgress(item.children) / 100) * weightPerItem;
    } else if (item.is_completed) {
      totalProgress += weightPerItem;
    }
  });
  
  return totalProgress;
};
```

**예시**:
- 부모 1개(자식 2개) + 부모 1개(자식 없음)
- 각 최상위 항목이 50% 비중을 가짐
- 하위 항목도 부모 내에서 동등한 비중

**관련 파일**:
- `frontend/src/components/ToDoListDisplay.jsx` - 메인 계산 로직
- `frontend/src/components/Sidebar.jsx` - 프로젝트 진행률 표시
- `frontend/src/components/ProgressBar.jsx` - 진행률 바 렌더링

---

### 4. **전문적인 키워드 입력 모달** (Professional Keyword Modal)

**목적**: 브라우저 기본 `prompt()`를 대체하는 사용자 친화적 UI

**이전**:
```javascript
const keyword = prompt("키워드를 입력하세요");
```

**현재**:
- **유효성 검증**: 2-50자 제한, 실시간 에러 표시
- **문자 수 카운터**: 입력 길이 실시간 표시 (예: 5/50)
- **추천 키워드**: 빠른 입력을 위한 버튼 4개
- **키보드 단축키**: Enter (제출), Escape (취소)
- **외부 클릭 닫기**: 배경 클릭 시 모달 닫힘

**관련 파일**:
- `frontend/src/components/KeywordInputModal.jsx` - 새 컴포넌트
- `frontend/src/App.jsx` - 모달 통합 및 상태 관리
- `frontend/src/pages/HomePage.jsx` - 키워드 제출 핸들러

**API 통합**:
```javascript
const handleKeywordSubmit = async (keyword) => {
  const promise = createToDoList(keyword);
  toast.promise(promise, {
    loading: `"${keyword}" 프로젝트 생성 중...`,
    success: (newProject) => {
      setProjects(prev => [...prev, newProject]);
      setActiveProject(newProject); // 자동 활성화
      return `"${keyword}" 프로젝트가 생성되었습니다!`;
    },
    error: '프로젝트 생성에 실패했습니다.',
  });
  
  setIsKeywordModalOpen(false);
};
```

---

### 5. **온보딩 가이드 & 빈 상태 UI** (Onboarding & Empty State)

**목적**: 처음 방문하는 사용자를 위한 안내 및 빈 화면 개선

**OnboardingGuide**:
- 최초 방문 시 자동 표시
- 사용 방법 단계별 안내
- "다시 보지 않기" 옵션
- `localStorage`에 표시 여부 저장

**EmptyState**:
- **프로젝트 없음**: "첫 프로젝트를 만들어보세요!" + CTA 버튼
- **할 일 없음**: "할 일을 추가해보세요!" 안내

**관련 파일**:
- `frontend/src/components/OnboardingGuide.jsx` - 온보딩 컴포넌트
- `frontend/src/components/EmptyState.jsx` - 빈 상태 컴포넌트
- `frontend/src/App.jsx` - 빈 프로젝트 상태 처리

---

### 6. **컨텍스트 인지 AI 하위 항목 생성** (Context-Aware AI)

**목적**: 프로젝트 키워드를 고려한 맞춤형 하위 작업 생성

**이전**:
```javascript
const prompt = `"${item.description}"에 대한 하위 작업 3개를 생성해주세요.`;
```

**현재**:
```javascript
const prompt = `프로젝트 키워드: "${projectKeyword}"
현재 작업: "${item.description}"

이 프로젝트의 맥락을 고려하여 "${item.description}"을(를) 완료하기 위한 
구체적이고 실행 가능한 하위 작업 3개를 생성해주세요.`;
```

**효과**:
- 프로젝트 맥락에 맞는 하위 작업 생성
- 더 구체적이고 실용적인 제안
- 키워드 기반 일관성 유지

**관련 파일**:
- `frontend/src/pages/HomePage.jsx` - AI 생성 로직
- `backend/src/services/ai_service.py` - Gemini API 호출

---

## 🎨 UI/UX 개선

### 시각적 변경사항

| 항목 | 이전 | 현재 |
|------|------|------|
| **우선순위 표시** | 항목 텍스트 앞 이모지 (🔴🟡⚪) | 왼쪽 테두리 색상 코드 |
| **우선순위 선택** | 항목별 개별 선택기 | 케밥 메뉴 내 통합 |
| **마감일 표시** | 없음 | 색상 코드 배지 (📅) |
| **프로젝트 제목** | 드롭다운 아이콘(▼) 있음 | 아이콘 제거, 클릭 시 수정 |
| **키워드 입력** | `prompt()` 기본 대화상자 | 전문 모달 UI |
| **진행률 바** | 단순 카운트 기반 | 가중치 기반 정확한 계산 |
| **항목 통계** | 없음 | 완료/전체 수 표시 (5/12) |
| **빈 화면** | 간단한 텍스트 | 친근한 안내 + CTA 버튼 |
| **케밥 메뉴 위치** | 버튼 왼쪽 끝 기준 | 버튼 중심 정렬 |

### 레이아웃 개선

**Sidebar.jsx**:
```jsx
{/* [추가] 진행률 바 및 통계 */}
<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className={`h-full transition-all duration-300 rounded-full ${
      progress === 100 ? 'bg-green-500' : 'bg-blue-500'
    }`}
    style={{ width: `${progress}%` }}
  />
</div>

{/* [추가] 항목 수 표시 */}
<span className="text-xs text-gray-500">
  {completedItems}/{totalItems} 항목
</span>
```

**ToDoItem.jsx**:
```jsx
{/* [추가] 마감일 배지 - 색상 코드로 긴급도 표시 */}
{item.due_date && (
  <span className={`text-xs px-2 py-1 rounded-full ${
    new Date(item.due_date) < new Date() && !item.is_completed
      ? 'bg-red-100 text-red-700'  // 마감일 지남
      : new Date(item.due_date) < new Date(Date.now() + 24 * 60 * 60 * 1000)
      ? 'bg-orange-100 text-orange-700'  // 24시간 이내
      : 'bg-blue-100 text-blue-700'  // 여유 있음
  }`}>
    📅 {formatDate(item.due_date)}
  </span>
)}
```

### 애니메이션 효과

**ToDoItem.jsx**:
```css
.item-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.item-slide-out {
  animation: slideOut 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.success-pulse {
  animation: successPulse 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideOut {
  to { 
    opacity: 0; 
    transform: translateX(-100%); 
    height: 0;
    margin: 0;
    padding: 0;
  }
}

@keyframes successPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
}
```

---

## 🔧 백엔드 변경사항

### 데이터베이스 스키마

**models/todo.py**:
```python
class ToDoItem(Base):
    __tablename__ = "todo_items"
    
    # 기존 필드
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    description = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False)
    order = Column(Integer, nullable=False)
    
    # [추가] 새 필드
    priority = Column(String, default='none')  # 우선순위
    due_date = Column(DateTime, nullable=True)  # 마감일
    reminder_date = Column(DateTime, nullable=True)  # 알림 날짜
```

### API 스키마

**schemas.py**:
```python
class ToDoItemBase(BaseModel):
    description: str
    is_completed: bool = False
    order: int
    # [추가] 새 필드
    priority: str = 'none'
    due_date: Optional[datetime] = None
    reminder_date: Optional[datetime] = None

class ToDoItemUpdate(BaseModel):
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    order: Optional[int] = None
    # [추가] 새 필드
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    reminder_date: Optional[datetime] = None
```

### 마이그레이션

**migrations/add_priority_to_todo.sql**:
```sql
-- 우선순위 컬럼 추가
ALTER TABLE todo_items ADD COLUMN priority VARCHAR DEFAULT 'none';

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX idx_todo_items_priority ON todo_items (priority);

-- 기존 데이터 업데이트
UPDATE todo_items SET priority = 'none' WHERE priority IS NULL;
```

**migrations/add_dates_to_todo.sql**:
```sql
-- 날짜 컬럼 추가
ALTER TABLE todo_items ADD COLUMN due_date DATETIME NULL;
ALTER TABLE todo_items ADD COLUMN reminder_date DATETIME NULL;

-- 인덱스 생성
CREATE INDEX idx_todo_items_due_date ON todo_items (due_date);
CREATE INDEX idx_todo_items_reminder_date ON todo_items (reminder_date);
```

---

## 💻 프론트엔드 변경사항

### 상태 관리

**App.jsx**:
```javascript
// [추가] 키워드 모달 상태
const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);

// [수정] 프로젝트 생성 - prompt() → 모달
const handleAddNewProject = () => {
  setIsKeywordModalOpen(true);  // 이전: prompt() 직접 호출
};

// [추가] 키워드 제출 핸들러
const handleKeywordSubmit = async (keyword) => {
  const promise = createToDoList(keyword);
  toast.promise(promise, {
    loading: `"${keyword}" 프로젝트 생성 중...`,
    success: (newProject) => {
      setProjects(prev => [...prev, newProject]);
      setActiveProject(newProject);  // [추가] 자동 활성화
      return `"${keyword}" 프로젝트가 생성되었습니다!`;
    },
    error: '프로젝트 생성에 실패했습니다.',
  });
  setIsKeywordModalOpen(false);
};
```

**HomePage.jsx**:
```javascript
// [추가] 우선순위 업데이트 핸들러
const handleUpdatePriority = async (itemId, newPriority) => {
  const updateRecursive = (items) => {
    return items.map(item => {
      if (item.id === itemId) {
        return { ...item, priority: newPriority };
      }
      if (item.children && item.children.length > 0) {
        return { ...item, children: updateRecursive(item.children) };
      }
      return item;
    });
  };
  
  const updatedItems = updateRecursive(project.items);
  setProjects(prev => prev.map(p => 
    p.id === project.id ? { ...p, items: updatedItems } : p
  ));
  
  await updateToDoItem(itemId, { priority: newPriority });
};

// [추가] 마감일 업데이트 핸들러
const handleUpdateDueDate = async (itemId, newDueDate) => {
  try {
    const updateRecursive = (items) => {
      return items.map(item => {
        if (item.id === itemId) {
          return { ...item, due_date: newDueDate };
        }
        if (item.children && item.children.length > 0) {
          return { ...item, children: updateRecursive(item.children) };
        }
        return item;
      });
    };
    
    const updatedItems = updateRecursive(project.items);
    setProjects(prev => prev.map(p => 
      p.id === project.id ? { ...p, items: updatedItems } : p
    ));
    
    await updateToDoItem(itemId, { due_date: newDueDate });
    toast.success('마감일이 설정되었습니다.');
  } catch (error) {
    toast.error('마감일 설정에 실패했습니다.');
  }
};
```

### 컴포넌트 Props 확장

**ToDoItem.jsx**:
```javascript
const ToDoItem = ({
  item,
  // ... 기존 props
  onUpdatePriority,  // [추가] 우선순위 업데이트 핸들러
}) => {
  // [추가] 우선순위 설정 객체
  const priorityConfig = {
    none: { color: 'border-l-gray-200', icon: '○' },
    low: { color: 'border-l-gray-400', icon: '⚪' },
    medium: { color: 'border-l-orange-500', icon: '🟡' },
    high: { color: 'border-l-red-500', icon: '🔴' }
  };
  
  const currentPriorityConfig = priorityConfig[item.priority || 'none'];
  
  // [수정] 케밥 메뉴에 우선순위 및 마감일 설정 추가
  const handleMenuClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const buttonCenterX = rect.left + rect.width / 2;  // [개선] 중심 계산
    
    onOpenContextMenu(
      buttonCenterX,
      rect.bottom + 5,
      item,
      item.priority,  // [추가] 현재 우선순위 전달
      item.due_date   // [추가] 현재 마감일 전달
    );
  };
};
```

**ContextMenu.jsx**:
```javascript
function ContextMenu({ x, y, options, onClose, priorityConfig, dateConfig }) {
  // [개선] 메뉴 중앙 정렬
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const centeredLeft = x - rect.width / 2;  // 중심 기준
      let finalLeft = Math.max(10, Math.min(
        centeredLeft, 
        window.innerWidth - rect.width - 10
      ));
      menuRef.current.style.left = `${finalLeft}px`;
    }
  }, [x, y]);
  
  return (
    <div className="...">
      {/* [추가] 우선순위 섹션 */}
      {priorityConfig && (
        <div className="px-4 py-3 border-b">
          <p className="text-xs text-gray-500 mb-2">우선순위</p>
          <PrioritySelector 
            value={priorityConfig.currentPriority}
            onChange={priorityConfig.onPriorityChange}
          />
        </div>
      )}
      
      {/* [추가] 마감일 섹션 */}
      {dateConfig && (
        <div className="px-4 py-3 border-b">
          <DateTimePicker
            label="마감일"
            value={dateConfig.dueDate}
            onChange={dateConfig.onDueDateChange}
            showTime={true}
          />
        </div>
      )}
      
      {/* 기존 액션 메뉴 */}
      {options.map(option => (...))}
    </div>
  );
}
```

---

## 🆕 새로 추가된 컴포넌트

### 1. PrioritySelector.jsx

**목적**: 4단계 우선순위 선택 UI

```jsx
const PrioritySelector = ({ value = 'none', onChange, disabled = false }) => {
  const priorities = [
    { value: 'none', label: '없음', color: 'text-gray-400 bg-gray-50', icon: '○' },
    { value: 'low', label: '낮음', color: 'text-gray-600 bg-gray-50', icon: '⚪' },
    { value: 'medium', label: '보통', color: 'text-orange-600 bg-orange-50', icon: '🟡' },
    { value: 'high', label: '높음', color: 'text-red-600 bg-red-50', icon: '🔴' }
  ];
  
  return (
    <div className="flex flex-row rounded-lg border overflow-hidden">
      {priorities.map((priority) => (
        <button
          onClick={() => onChange(priority.value)}
          className={`px-3 py-1.5 flex-row items-center gap-1.5 whitespace-nowrap ${
            value === priority.value ? priority.color : 'bg-white'
          }`}
        >
          <span>{priority.icon}</span>
          <span>{priority.label}</span>
        </button>
      ))}
    </div>
  );
};
```

**주요 기능**:
- 가로 배치 버튼 그룹 (`flex-row`)
- 선택된 항목 하이라이트
- 아이콘 + 레이블 조합
- `whitespace-nowrap`으로 텍스트 줄바꿈 방지

---

### 2. DateTimePicker.jsx

**목적**: 마감일 날짜/시간 선택 UI

```jsx
const DateTimePicker = ({ value, onChange, label, showTime = true }) => {
  // ISO 문자열 ↔ datetime-local 형식 변환
  const toLocalDateTimeString = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
  };
  
  const toISOString = (localString) => {
    if (!localString) return null;
    return new Date(localString).toISOString();
  };
  
  return (
    <div className="flex flex-col gap-2">
      <label>{label}</label>
      <div className="flex gap-2">
        <input
          type={showTime ? "datetime-local" : "date"}
          value={toLocalDateTimeString(value)}
          onChange={(e) => onChange(toISOString(e.target.value))}
        />
        {value && (
          <button onClick={() => onChange(null)} title="날짜 제거">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
```

**주요 기능**:
- HTML5 네이티브 날짜 선택기 사용
- ISO 8601 형식과 로컬 시간 자동 변환
- 타임존 offset 고려
- 날짜 제거 버튼 제공

---

### 3. KeywordInputModal.jsx

**목적**: 프로젝트 키워드 입력 모달

```jsx
const KeywordInputModal = ({ isOpen, onClose, onSubmit }) => {
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    
    if (!trimmed) {
      setError('키워드를 입력해주세요.');
      return;
    }
    if (trimmed.length < 2) {
      setError('키워드는 최소 2자 이상이어야 합니다.');
      return;
    }
    if (trimmed.length > 50) {
      setError('키워드는 50자 이하로 입력해주세요.');
      return;
    }
    
    onSubmit(trimmed);
    setKeyword('');
    setError('');
  };
  
  const suggestions = [
    { text: '운동하기' },
    { text: '프로젝트 기획' },
    { text: '여행 준비' },
    { text: '시험 공부' },
  ];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-md w-full">
        <form onSubmit={handleSubmit}>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예: 운동하기"
            maxLength={50}
          />
          
          {/* 에러 및 문자 수 */}
          <div>
            {error && <p className="text-red-500">{error}</p>}
            <p className="text-gray-400">{keyword.length}/50</p>
          </div>
          
          {/* 추천 키워드 */}
          <div>
            {suggestions.map(s => (
              <button onClick={() => setKeyword(s.text)}>
                {s.text}
              </button>
            ))}
          </div>
          
          {/* 버튼 */}
          <button onClick={onClose}>취소</button>
          <button type="submit" disabled={!keyword.trim()}>
            생성하기
          </button>
        </form>
      </div>
    </div>
  );
};
```

**주요 기능**:
- 2-50자 유효성 검증
- 실시간 에러 표시
- 문자 수 카운터
- 추천 키워드 빠른 입력
- ESC 키/배경 클릭 닫기
- 자동 포커스

---

### 4. EmptyState.jsx

**목적**: 빈 화면 안내 UI

```jsx
const EmptyState = ({ type, onAction }) => {
  const config = {
    projects: {
      icon: '📁',
      title: '아직 프로젝트가 없어요',
      description: '첫 프로젝트를 만들어 할 일 관리를 시작해보세요!',
      actionLabel: '새 프로젝트 만들기',
    },
    todos: {
      icon: '✅',
      title: '할 일이 없어요',
      description: 'AI가 도와줄 수 있도록 키워드를 입력해보세요!',
      actionLabel: '할 일 추가하기',
    },
  };
  
  const { icon, title, description, actionLabel } = config[type];
  
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6 text-center">{description}</p>
      {onAction && (
        <button onClick={onAction} className="px-6 py-3 bg-blue-500 text-white rounded-lg">
          {actionLabel}
        </button>
      )}
    </div>
  );
};
```

**주요 기능**:
- 타입별 다른 메시지 표시 (projects, todos)
- 큰 이모지 아이콘
- CTA 버튼 제공
- 중앙 정렬 레이아웃

---

### 5. OnboardingGuide.jsx

**목적**: 최초 방문자 가이드

```jsx
const OnboardingGuide = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenGuide) {
      setIsVisible(true);
    }
  }, []);
  
  const handleClose = (dontShowAgain) => {
    if (dontShowAgain) {
      localStorage.setItem('hasSeenOnboarding', 'true');
    }
    setIsVisible(false);
  };
  
  const steps = [
    { icon: '📝', title: '프로젝트 만들기', description: '키워드를 입력하세요' },
    { icon: '🤖', title: 'AI 도움받기', description: 'AI가 할 일을 생성합니다' },
    { icon: '✅', title: '완료 체크', description: '진행률을 확인하세요' },
  ];
  
  return isVisible ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl">
        <h2>AI To-Do List 사용 가이드</h2>
        
        <div className="grid grid-cols-3 gap-4">
          {steps.map((step, i) => (
            <div key={i}>
              <div className="text-4xl">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
        
        <div>
          <label>
            <input type="checkbox" onChange={(e) => setDontShow(e.target.checked)} />
            다시 보지 않기
          </label>
          <button onClick={() => handleClose(dontShow)}>시작하기</button>
        </div>
      </div>
    </div>
  ) : null;
};
```

**주요 기능**:
- localStorage로 표시 여부 관리
- 3단계 사용 가이드
- "다시 보지 않기" 옵션
- 풀스크린 오버레이

---

## 📊 변경 사항 통계

### 파일 수정

| 분류 | 파일 수 | 주요 변경 |
|------|---------|-----------|
| **새 컴포넌트** | 5개 | PrioritySelector, DateTimePicker, KeywordInputModal, EmptyState, OnboardingGuide |
| **수정된 컴포넌트** | 8개 | App, HomePage, ToDoItem, ContextMenu, Sidebar, ToDoListDisplay, ProgressBar, Header |
| **백엔드 모델** | 2개 | models/todo.py, schemas.py |
| **마이그레이션** | 2개 | add_priority_to_todo.sql, add_dates_to_todo.sql |
| **총 변경 파일** | 17개 | |

### 코드 라인

| 분류 | 추가 | 삭제 | 순 변경 |
|------|------|------|---------|
| **프론트엔드** | ~800 라인 | ~150 라인 | +650 라인 |
| **백엔드** | ~50 라인 | ~5 라인 | +45 라인 |
| **주석/문서** | ~300 라인 | - | +300 라인 |
| **총계** | ~1150 라인 | ~155 라인 | +995 라인 |

### 기능별 영향도

| 기능 | 난이도 | 변경 범위 | 테스트 필요도 |
|------|--------|-----------|---------------|
| **우선순위 시스템** | ⭐⭐⭐ | Frontend + Backend | 높음 |
| **마감일 관리** | ⭐⭐⭐⭐ | Frontend + Backend | 높음 |
| **가중치 진행률** | ⭐⭐⭐⭐⭐ | Frontend (알고리즘) | 매우 높음 |
| **키워드 모달** | ⭐⭐ | Frontend UI | 중간 |
| **온보딩 가이드** | ⭐ | Frontend UI | 낮음 |
| **빈 상태 UI** | ⭐ | Frontend UI | 낮음 |

---

## 🔍 주요 버그 수정

### 1. PrioritySelector 텍스트 세로 배치

**문제**:
```jsx
// 이전 코드
<div className="flex rounded-lg">  // flex-direction 미지정
  <button className="px-3 py-1.5">
    <span>{icon}</span>
    <span>{label}</span>
  </button>
</div>
```

**해결**:
```jsx
<div className="flex flex-row rounded-lg">  // flex-row 명시
  <button className="flex flex-row items-center gap-1.5 whitespace-nowrap">
    <span>{icon}</span>
    <span>{label}</span>
  </button>
</div>
```

**원인**: Tailwind의 기본 `flex`는 방향이 명시되지 않으면 브라우저 기본값에 의존

---

### 2. ContextMenu 위치 정렬

**문제**:
```javascript
// 이전: 버튼 왼쪽 끝에서 메뉴 시작
onOpenContextMenu(rect.left, rect.bottom + 5);
```

**해결**:
```javascript
// 현재: 버튼 중심에 메뉴 중앙 정렬
const buttonCenterX = rect.left + rect.width / 2;
onOpenContextMenu(buttonCenterX, rect.bottom + 5);

// ContextMenu 내부
const centeredLeft = x - menuWidth / 2;
```

**효과**: 케밥 버튼 바로 아래 메뉴가 중앙 정렬되어 UI 일관성 향상

---

### 3. 새 프로젝트 버튼 동작 불량

**문제**:
```javascript
// 이전: prompt() 사용 시 취소하면 오류
const keyword = prompt("키워드 입력");
if (keyword) {
  createToDoList(keyword);  // keyword가 null이면 실행 안 됨
}
```

**해결**:
```javascript
// 현재: 모달 사용으로 명확한 제출/취소 분리
const handleKeywordSubmit = async (keyword) => {
  // 모달에서 이미 유효성 검증 완료
  await createToDoList(keyword);
};
```

---

## 🎓 배운 점 & 개선 아이디어

### 배운 점

1. **재귀적 진행률 계산**: 계층 구조를 정확히 반영하려면 가중치 기반 알고리즘 필요
2. **ISO 시간 처리**: 타임존 offset을 고려한 날짜 변환 중요
3. **Tailwind Layout**: `flex` 사용 시 방향(`flex-row/col`) 명시 필수
4. **중앙 정렬 계산**: 요소 중심 = `left + width / 2`, 메뉴 중앙 = `centerX - menuWidth / 2`
5. **모달 UX**: 자동 포커스, ESC 키, 외부 클릭 닫기 필수

### 추후 개선 아이디어

1. **알림 시스템**: `reminder_date` 활용한 브라우저 알림
2. **태그 기능**: 프로젝트 간 태그로 할 일 분류
3. **검색 기능**: 전체 프로젝트 대상 할 일 검색
4. **다크 모드**: 색상 테마 전환
5. **캘린더 뷰**: 마감일 기준 캘린더 형태 표시
6. **우선순위 정렬**: 우선순위별 자동 정렬 옵션
7. **반복 일정**: 주간/월간 반복 작업 지원

---

## 📚 참고 자료

### 기술 문서

- [Tailwind CSS Flexbox](https://tailwindcss.com/docs/flex-direction)
- [HTML5 datetime-local](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local)
- [ISO 8601 DateTime](https://en.wikipedia.org/wiki/ISO_8601)
- [SQLAlchemy DateTime](https://docs.sqlalchemy.org/en/20/core/type_basics.html#sqlalchemy.types.DateTime)
- [React DnD](https://react-dnd.github.io/react-dnd/)

### 관련 파일

- `IMPROVEMENT_SUGGESTIONS.md` - 기능 제안 문서
- `architecture.md` - 시스템 아키텍처
- `README.md` - 프로젝트 개요

---

**작성일**: 2025-01-XX  
**마지막 업데이트**: 우선순위 시스템, 마감일 관리, 가중치 진행률, 키워드 모달, 온보딩 가이드 구현 완료
