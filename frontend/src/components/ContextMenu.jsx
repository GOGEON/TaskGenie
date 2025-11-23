import React, { useEffect, useRef } from 'react';
import PrioritySelector from './PrioritySelector'; /* [추가] 우선순위 선택 컴포넌트 */
import DateTimePicker from './DateTimePicker'; /* [추가] 날짜/시간 선택 컴포넌트 */

/* [개선] 케밥 메뉴 컴포넌트 - 우선순위, 마감일, 액션 메뉴 통합 */
/* 이전: 단순 수정/삭제/AI 생성 액션만 제공 */
/* 현재: 우선순위 선택, 마감일 설정, 기존 액션 모두 포함 */
function ContextMenu({ x, y, options, onClose, priorityConfig, dateConfig }) {
  const menuRef = useRef(null);

  /* [추가] 메뉴 외부 클릭 시 닫기 */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  /* [개선] 메뉴 위치 자동 조정 - 화면 밖으로 나가지 않도록 처리 */
  /* [개선] 케밥 버튼 중심으로 메뉴 정렬 (이전: 버튼 왼쪽 끝 기준) */
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      /* 메뉴를 버튼 중심으로 정렬 */
      const centeredLeft = x - rect.width / 2;
      let finalLeft = centeredLeft;
      
      // 왼쪽으로 넘어가면 조정
      if (centeredLeft < 10) {
        finalLeft = 10;
      }
      // 오른쪽으로 넘어가면 조정
      else if (centeredLeft + rect.width > viewportWidth - 10) {
        finalLeft = viewportWidth - rect.width - 10;
      }
      
      menuRef.current.style.left = `${finalLeft}px`;
      
      // 아래로 넘어가면 위로 이동
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${y - rect.height - 5}px`;
      }
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="absolute bg-white shadow-lg rounded-lg py-2 z-50 min-w-[200px] sm:min-w-[280px] border border-slate-200 animate-scaleIn"
      style={{ top: y, left: x }}
    >
      {/* [추가] 우선순위 선택 섹션 - 케밥 메뉴 내 통합 */}
      {priorityConfig && (
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs text-slate-500 mb-2">우선순위</p>
          <PrioritySelector 
            value={priorityConfig.currentPriority}
            onChange={(newPriority) => {
              priorityConfig.onPriorityChange(newPriority);
            }}
          />
        </div>
      )}
      
      {/* [추가] 마감일 설정 섹션 - 날짜/시간 선택기 통합 */}
      {/* [수정] 시간 입력 선택 사항으로 변경 (showTime prop 제거) */}
      {dateConfig && (
        <div className="px-4 py-3 border-b border-slate-100">
          <DateTimePicker
            label="마감일"
            value={dateConfig.dueDate}
            onChange={(newDate) => {
              dateConfig.onDueDateChange(newDate);
            }}
          />
        </div>
      )}
      
      {/* 메뉴 옵션들 */}
      <ul>
        {options.map((option, index) => (
          <li
            key={index}
            className="px-4 py-2.5 sm:py-2 hover:bg-slate-50 active:bg-slate-100 cursor-pointer text-sm sm:text-base touch-manipulation transition-all hover:pl-5 text-slate-700"
            onClick={() => {
              if (option.onClick) {
                option.onClick();
              } else if (option.action) {
                option.action();
              }
              onClose();
            }}
          >
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ContextMenu;
