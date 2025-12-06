/**
 * 빈 상태 표시 컴포넌트
 * 
 * 데이터가 없을 때 사용자에게 표시되는 안내 UI.
 * 프로젝트 목록이 비었거나, 할 일 목록이 비었을 때 사용됨.
 * 
 * @module EmptyState
 */
import React from 'react';
import { RiRocketLine, RiTaskLine, RiLightbulbLine, RiArrowRightLine } from 'react-icons/ri';


/**
 * EmptyState 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {string} [props.type='projects'] - 빈 상태 유형 ('projects' | 'tasks')
 * @param {Function} props.onAction - 액션 버튼 클릭 핸들러
 * @param {string} props.actionLabel - 액션 버튼 텍스트
 * @param {JSX.Element} props.icon - 사용자 정의 아이콘
 * @param {string} props.title - 사용자 정의 제목
 * @param {string} props.description - 사용자 정의 설명
 * @param {boolean} [props.showAction=true] - 액션 버튼 표시 여부
 * @returns {JSX.Element} 빈 상태 뷰
 */
const EmptyState = ({ 
  type = 'projects', // 'projects' | 'tasks'
  onAction,
  actionLabel,
  icon,
  title,
  description,
  showAction = true
}) => {
  // 기본 메시지 설정
  const defaultMessages = {
    projects: {
      icon: <RiRocketLine className="w-16 h-16 text-indigo-400" />,
      title: '첫 프로젝트를 만들어보세요!',
      description: '키워드를 입력하면 AI가 자동으로 할 일을 생성해드립니다.',
      actionLabel: '새 프로젝트 만들기'
    },
    tasks: {
      icon: <RiTaskLine className="w-16 h-16 text-indigo-400" />,
      title: 'AI에게 세부 작업을 요청해보세요',
      description: '할 일 항목을 선택하고 하위 작업을 자동으로 생성할 수 있습니다.',
      actionLabel: 'AI로 작업 생성하기'
    }
  };

  const message = defaultMessages[type];
  const displayIcon = icon || message.icon;
  const displayTitle = title || message.title;
  const displayDescription = description || message.description;
  const displayActionLabel = actionLabel || message.actionLabel;

  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
      {/* 아이콘 */}
      <div className="mb-6 animate-bounce-slow">
        {displayIcon}
      </div>

      {/* 제목 */}
      <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">
        {displayTitle}
      </h3>

      {/* 설명 */}
      <p className="text-sm sm:text-base text-slate-600 mb-8 max-w-md leading-relaxed">
        {displayDescription}
      </p>

      {/* 액션 버튼 */}
      {showAction && onAction && (
        <button
          onClick={onAction}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
        >
          <span>{displayActionLabel}</span>
          <RiArrowRightLine className="w-5 h-5" />
        </button>
      )}

      {/* 힌트 */}
      {type === 'projects' && (
        <div className="mt-8 p-4 bg-indigo-50 rounded-lg max-w-md border border-indigo-100">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 text-xl text-indigo-500">
              <RiLightbulbLine />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-indigo-900 mb-1">
                빠른 시작 팁
              </p>
              <p className="text-xs text-indigo-700">
                "운동하기", "프로젝트 기획", "여행 준비" 같은 키워드를 입력하면 
                AI가 체계적인 할 일 목록을 자동으로 만들어드립니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
