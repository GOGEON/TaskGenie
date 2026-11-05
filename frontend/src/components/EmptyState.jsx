/**
 * 빈 상태 표시 컴포넌트
 *
 * 프로젝트 목록이나 할 일 목록이 비었을 때 표시되는 안내.
 * 빈 종이(괘선 몇 줄)를 그리고, 무엇을 하면 되는지 한 문장으로 말한다.
 *
 * @module EmptyState
 */
import React from 'react';
import { RiAddLine } from 'react-icons/ri';

/** 빈 괘선 — 빈 목록을 그대로 보여 주는 그림 */
const BlankLines = () => (
  <div className="w-full max-w-xs" aria-hidden="true">
    {[72, 54, 64].map((w, i) => (
      <div key={i} className="flex items-center gap-3 border-b border-rule py-2.5">
        <span className="h-[18px] w-[18px] flex-shrink-0 rounded-[4px] border-[1.5px] border-rule-strong" />
        <span className="h-2 rounded-sm bg-paper-3/70" style={{ width: `${w}%` }} />
      </div>
    ))}
  </div>
);

/**
 * EmptyState 컴포넌트.
 *
 * @param {Object} props - 컴포넌트 속성
 * @param {string} [props.type='projects'] - 빈 상태 유형 ('projects' | 'tasks')
 * @param {Function} props.onAction - 액션 버튼 클릭 핸들러
 * @param {string} props.actionLabel - 액션 버튼 텍스트
 * @param {string} props.title - 사용자 정의 제목
 * @param {string} props.description - 사용자 정의 설명
 * @param {boolean} [props.showAction=true] - 액션 버튼 표시 여부
 * @returns {JSX.Element} 빈 상태 뷰
 */
const EmptyState = ({
  type = 'projects',
  onAction,
  actionLabel,
  title,
  description,
  showAction = true,
}) => {
  const defaultMessages = {
    projects: {
      title: '아직 프로젝트가 없습니다',
      description:
        '하고 싶은 일을 한 단어로 적어 보세요. ‘이사 준비’, ‘기말고사’, ‘제주도 여행’ 같은 키워드면 AI가 할 일 목록으로 나눠 적어 둡니다.',
      actionLabel: '새 프로젝트',
    },
    tasks: {
      title: '이 프로젝트는 비어 있습니다',
      description: '첫 항목을 적어 보세요.',
      actionLabel: '할 일 추가',
    },
  };

  const message = defaultMessages[type] || defaultMessages.projects;
  const displayTitle = title || message.title;
  const displayDescription = description || message.description;
  const displayActionLabel = actionLabel || message.actionLabel;

  return (
    <div
      className={`flex flex-col items-start ${
        type === 'projects' ? 'mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-8 sm:pt-16' : 'py-6'
      }`}
    >
      <BlankLines />

      <h2 className="mt-8 break-keep font-serif text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {displayTitle}
      </h2>
      <p className="mt-3 max-w-md break-keep text-[15px] leading-relaxed text-ink-2">{displayDescription}</p>

      {showAction && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-7 inline-flex items-center gap-2 rounded bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink-2"
        >
          <RiAddLine aria-hidden="true" />
          {displayActionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
