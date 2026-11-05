import React from 'react';

/**
 * 진행률 표시 — 숫자는 모노스페이스, 막대는 3px 괘선.
 *
 * @param {Object} props
 * @param {number} props.progress - 0~100
 * @param {number} [props.completed] - 완료 항목 수
 * @param {number} [props.total] - 전체 항목 수
 */
function ProgressBar({ progress, completed, total }) {
  const pct = Math.round(progress);
  const isDone = pct >= 100;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between font-mono text-xs text-ink-3 tabular">
        <span>
          {typeof total === 'number' ? `${completed}/${total} 완료` : '진행률'}
        </span>
        <span className={isDone ? 'text-moss' : 'text-ink'}>{pct}%</span>
      </div>
      <div
        className="h-[3px] w-full bg-rule"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full transition-[width] duration-500 ease-out ${isDone ? 'bg-moss' : 'bg-ink'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
