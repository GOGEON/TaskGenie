/* [추가] 우선순위 선택 컴포넌트 - 4단계 우선순위 관리 */
/* 없음(none), 낮음(low), 보통(medium), 높음(high) 4단계 제공 */
/* 각 단계별 색상 코딩: 회색, 회색, 주황, 빨강 */
import React from 'react';

const PrioritySelector = ({ value = 'none', onChange, disabled = false }) => {
  /* 우선순위 옵션 정의 - 아이콘, 레이블, 색상 */
  /* [수정] 텍스트 색상(text)과 배경 색상(bg)을 분리하여 정의 */
  /* 선택되지 않아도 텍스트/아이콘 색상은 항상 표시됨 */
  const priorities = [
    { value: 'none', label: '없음', text: 'text-gray-500', bg: 'bg-gray-50', hover: 'hover:bg-gray-100', icon: '○' },
    { value: 'low', label: '낮음', text: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:bg-blue-100', icon: '⚪' },
    { value: 'medium', label: '보통', text: 'text-orange-600', bg: 'bg-orange-50', hover: 'hover:bg-orange-100', icon: '🟡' },
    { value: 'high', label: '높음', text: 'text-red-600', bg: 'bg-red-50', hover: 'hover:bg-red-100', icon: '🔴' }
  ];

  const currentPriority = priorities.find(p => p.value === value) || priorities[0];

  return (
    /* [개선] 가로 배치 버튼 그룹 (이전 버그: 세로 배치) */
    /* flex-row와 whitespace-nowrap으로 텍스트 가로 정렬 보장 */
    <div className="flex flex-row rounded-lg border border-gray-200 overflow-hidden">
      {priorities.map((priority) => (
        <button
          key={priority.value}
          type="button"
          onClick={() => !disabled && onChange(priority.value)}
          disabled={disabled}
          className={`
            px-3 py-1.5 text-sm transition-colors whitespace-nowrap
            ${priority.text} /* 항상 고유 텍스트 색상 적용 */
            ${value === priority.value ? priority.bg : 'bg-white hover:bg-gray-50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            flex flex-row items-center gap-1.5
          `}
          title={priority.label}
        >
          <span>{priority.icon}</span>
          <span className="font-medium">{priority.label}</span>
        </button>
      ))}
    </div>
  );
};

export default PrioritySelector;
