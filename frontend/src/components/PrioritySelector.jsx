import React from 'react';

/** 우선순위 정의 — 색은 체크박스 테두리 색과 같다 */
const PRIORITIES = [
  { value: 'none', label: '없음', dot: 'border border-ink-4 bg-transparent' },
  { value: 'low', label: '낮음', dot: 'bg-blueink' },
  { value: 'medium', label: '보통', dot: 'bg-ochre' },
  { value: 'high', label: '높음', dot: 'bg-accent' },
];

/**
 * 우선순위 선택 — 4칸짜리 분할 버튼.
 *
 * @param {Object} props
 * @param {string} props.value - 현재 우선순위
 * @param {Function} props.onChange - 변경 콜백
 * @param {boolean} [props.disabled]
 */
const PrioritySelector = ({ value = 'none', onChange, disabled = false }) => (
  <div className="grid grid-cols-4 overflow-hidden rounded border border-rule" role="radiogroup" aria-label="우선순위">
    {PRIORITIES.map((priority, i) => {
      const selected = value === priority.value;
      return (
        <button
          key={priority.value}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => !disabled && onChange(priority.value)}
          disabled={disabled}
          className={`flex items-center justify-center gap-1.5 whitespace-nowrap px-2 py-1.5 text-xs transition-colors ${
            i > 0 ? 'border-l border-rule' : ''
          } ${selected ? 'bg-ink font-medium text-paper' : 'bg-sheet text-ink-2 hover:bg-paper-2'} ${
            disabled ? 'opacity-50' : ''
          }`}
        >
          <span className={`h-2 w-2 flex-shrink-0 rounded-[2px] ${priority.dot}`} aria-hidden="true" />
          {priority.label}
        </button>
      );
    })}
  </div>
);

export default PrioritySelector;
