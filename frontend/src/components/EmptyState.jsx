import React from 'react';

/**
 * EmptyState 컴포넌트
 * 프로젝트나 할 일 항목이 없을 때 표시되는 빈 상태 UI
 */
const EmptyState = ({ 
  type = 'projects', // 'projects' | 'tasks'
  onAction,
  actionLabel,
  icon = '📋',
  title,
  description,
  showAction = true
}) => {
  // 기본 메시지 설정
  const defaultMessages = {
    projects: {
      icon: '🚀',
      title: '첫 프로젝트를 만들어보세요!',
      description: '키워드를 입력하면 AI가 자동으로 할 일을 생성해드립니다.',
      actionLabel: '새 프로젝트 만들기'
    },
    tasks: {
      icon: '✨',
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
      <div className="mb-6 text-6xl sm:text-7xl animate-bounce-slow">
        {displayIcon}
      </div>

      {/* 제목 */}
      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
        {displayTitle}
      </h3>

      {/* 설명 */}
      <p className="text-sm sm:text-base text-gray-600 mb-8 max-w-md leading-relaxed">
        {displayDescription}
      </p>

      {/* 액션 버튼 */}
      {showAction && onAction && (
        <button
          onClick={onAction}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
        >
          <span>{displayActionLabel}</span>
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 7l5 5m0 0l-5 5m5-5H6" 
            />
          </svg>
        </button>
      )}

      {/* 힌트 */}
      {type === 'projects' && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 text-2xl">💡</div>
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900 mb-1">
                빠른 시작 팁
              </p>
              <p className="text-xs text-blue-700">
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
