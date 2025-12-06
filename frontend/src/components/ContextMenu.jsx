/**
 * 컨텍스트 메뉴 컴포넌트
 * 
 * 마우스 우클릭 시 나타나는 팝업 메뉴.
 * 항목에 대한 빠른 액션(우선순위 변경, 마감일 설정, 수정/삭제 등)을 제공.
 * 화면 경계를 벗어나지 않도록 위치 자동 조정 기능 포함.
 * 
 * 주요 기능:
 * - 메뉴 위치 자동 보정 (화면 이탈 방지)
 * - 우선순위 선택기 통합
 * - 마감일 선택기(DatePicker) 통합
 * - 커스텀 액션 실행
 * 
 * @module ContextMenu
 */
import React, { useEffect, useRef, useState } from 'react';
import PrioritySelector from './PrioritySelector';
import CustomDatePicker from './CustomDatePicker';


/**
 * ContextMenu 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {number} props.x - 메뉴 표시 X 좌표
 * @param {number} props.y - 메뉴 표시 Y 좌표
 * @param {Array} props.options - 메뉴 항목 배열 ({ label, onClick/action })
 * @param {Function} props.onClose - 메뉴 닫기 콜백
 * @param {Object} props.priorityConfig - 우선순위 설정 객체 (선택사항)
 * @param {Object} props.dateConfig - 마감일 설정 객체 (선택사항)
 * @returns {JSX.Element} 컨텍스트 메뉴 팝업
 */
function ContextMenu({ x, y, options, onClose, priorityConfig, dateConfig }) {
  const menuRef = useRef(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
          <p className="text-xs text-slate-500 mb-2">마감일</p>
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`w-full px-3 py-2 text-sm text-left border rounded-md flex items-center justify-between transition-colors ${
                showDatePicker 
                  ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-100 text-indigo-700' 
                  : dateConfig.dueDate 
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' 
                    : 'border-slate-300 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <i className="ri-calendar-line"></i>
                {dateConfig.dueDate ? new Date(dateConfig.dueDate).toLocaleDateString() : '마감일 설정'}
              </span>
              {dateConfig.dueDate && (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    dateConfig.onDueDateChange(null);
                  }}
                  className="hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                >
                  <i className="ri-close-line"></i>
                </span>
              )}
            </button>

            {showDatePicker && (
              <div className="absolute left-0 top-full mt-2 z-50">
                <CustomDatePicker
                  selectedDate={dateConfig.dueDate ? new Date(dateConfig.dueDate) : null}
                  onChange={(date) => {
                    dateConfig.onDueDateChange(date ? date.toISOString() : null);
                    if (!showTimePicker) setShowDatePicker(false);
                  }}
                  onClose={() => setShowDatePicker(false)}
                  showTime={showTimePicker}
                  onToggleTime={() => setShowTimePicker(!showTimePicker)}
                />
              </div>
            )}
          </div>
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
