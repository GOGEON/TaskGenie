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
import { RiCalendarLine, RiCloseLine } from 'react-icons/ri';


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

  const formatDue = (iso) => {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}${hasTime ? ` ${pad(d.getHours())}:${pad(d.getMinutes())}` : ''}`;
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute z-50 min-w-[240px] rounded-md border border-rule bg-sheet py-1 shadow-pop animate-pop-in sm:min-w-[288px]"
      style={{ top: y, left: x }}
    >
      {/* 우선순위 */}
      {priorityConfig && (
        <div className="border-b border-rule px-3 pb-3 pt-2">
          <p className="mb-2 text-xs text-ink-3">우선순위</p>
          <PrioritySelector 
            value={priorityConfig.currentPriority}
            onChange={(newPriority) => {
              priorityConfig.onPriorityChange(newPriority);
            }}
          />
        </div>
      )}
      
      {/* 마감일 */}
      {dateConfig && (
        <div className="border-b border-rule px-3 pb-3 pt-2">
          <p className="mb-2 text-xs text-ink-3">마감일</p>
          <div className="relative">
            <div
              className={`flex w-full items-center rounded border text-sm transition-colors ${
                showDatePicker ? 'border-ink bg-paper' : 'border-rule hover:border-ink-3'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex flex-1 items-center gap-2 px-2.5 py-2 text-left"
                aria-expanded={showDatePicker}
              >
                <RiCalendarLine className="text-ink-3" aria-hidden="true" />
                {dateConfig.dueDate ? (
                  <span className="font-mono text-[13px] text-ink tabular">{formatDue(dateConfig.dueDate)}</span>
                ) : (
                  <span className="text-ink-3">마감일 설정</span>
                )}
              </button>
              {dateConfig.dueDate && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    dateConfig.onDueDateChange(null);
                  }}
                  className="mr-1 rounded p-1 text-ink-3 transition-colors hover:bg-accent-wash hover:text-accent-ink"
                  aria-label="마감일 지우기"
                >
                  <RiCloseLine />
                </button>
              )}
            </div>

            {showDatePicker && (
              <div className="absolute left-0 top-full z-50 mt-2">
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
      
      {/* 메뉴 항목 */}
      <ul className="py-1">
        {options.map((option, index) => (
          <li key={index} role="none">
            <button
              type="button"
              role="menuitem"
              className={`w-full px-3 py-2 text-left text-sm transition-colors touch-manipulation ${
                option.danger
                  ? 'text-accent-ink hover:bg-accent-wash'
                  : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
              }`}
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
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ContextMenu;
