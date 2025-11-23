import React from 'react';
import { RiFlag2Line, RiFlag2Fill, RiCheckboxBlankCircleLine } from 'react-icons/ri';

const PrioritySelector = ({ value = 'none', onChange, disabled = false }) => {
  /* 우선순위 옵션 정의 - 아이콘, 레이블, 색상 */
  const priorities = [
    { value: 'none', label: '없음', text: 'text-slate-500', bg: 'bg-slate-100', hover: 'hover:bg-slate-100', icon: <RiCheckboxBlankCircleLine /> },
    { value: 'low', label: '낮음', text: 'text-indigo-600', bg: 'bg-indigo-50', hover: 'hover:bg-indigo-50', icon: <RiFlag2Fill /> },
    { value: 'medium', label: '보통', text: 'text-orange-600', bg: 'bg-orange-50', hover: 'hover:bg-orange-50', icon: <RiFlag2Fill /> },
    { value: 'high', label: '높음', text: 'text-red-600', bg: 'bg-red-50', hover: 'hover:bg-red-50', icon: <RiFlag2Fill /> }
  ];

  const currentPriority = priorities.find(p => p.value === value) || priorities[0];

  return (
    /* [개선] 가로 배치 버튼 그룹 */
    <div className="flex flex-row rounded-lg border border-slate-200 overflow-hidden">
      {priorities.map((priority) => (
        <button
          key={priority.value}
          type="button"
          onClick={() => !disabled && onChange(priority.value)}
          disabled={disabled}
          className={`
            px-3 py-1.5 text-sm transition-colors whitespace-nowrap
            ${priority.text} /* 항상 고유 텍스트 색상 적용 */
            ${value === priority.value ? priority.bg : 'bg-white hover:bg-slate-50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            flex flex-row items-center gap-1.5
          `}
          title={priority.label}
        >
          <span className="text-lg">{priority.icon}</span>
          <span className="font-medium">{priority.label}</span>
        </button>
      ))}
    </div>
  );
};

export default PrioritySelector;
