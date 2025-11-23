import React, { useState, useEffect, useRef } from 'react';

const Sidebar = ({ user, projects, activeProjectId, onSelectProject, onAddNewProject, onLogout }) => {
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  const userName = user?.username || '사용자';
  const userInitial = userName.charAt(0).toUpperCase();

  /* [개선] 가중치 기반 진행률 계산 - 계층 구조를 고려한 정확한 진행률 표시 */
  /* 이전: 단순 카운트 방식 (완료 항목 / 전체 항목 * 100) */
  /* 현재: 가중치 방식 (각 레벨의 항목이 동등한 비중을 가짐) */
  const calculateWeightedProgress = (items) => {
    if (!items || items.length === 0) return 100;

    let totalProgress = 0;
    const weightPerItem = 100 / items.length;

    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        totalProgress += (calculateWeightedProgress(item.children) / 100) * weightPerItem;
      } else if (item.is_completed) {
        totalProgress += weightPerItem;
      }
    });

    return totalProgress;
  };

  /* [추가] 재귀적으로 모든 하위 항목까지 카운트 - 통계 정보 표시용 */
  const countAllItems = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((total, item) => {
      return total + 1 + countAllItems(item.children);
    }, 0);
  };

  /* [추가] 재귀적으로 완료된 모든 하위 항목까지 카운트 - 통계 정보 표시용 */
  const countCompletedItems = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((total, item) => {
      const isCompleted = item.is_completed ? 1 : 0;
      return total + isCompleted + countCompletedItems(item.children);
    }, 0);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
      if (newWidth >= 240 && newWidth <= 500) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
  };

  return (
    <div
      ref={sidebarRef}
      style={{ width: width >= 240 ? `${width}px` : '100vw' }}
      className="relative bg-white border-r border-slate-200 flex flex-col h-screen w-full lg:w-auto"
    >
      {/* User Area */}
      <div className="h-[72px] px-4 border-b border-slate-200 flex items-center flex-shrink-0">
        <div className="flex items-center space-x-3 w-full">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex items-center text-sm text-slate-600 min-w-0 flex-1">
            <span className="truncate font-medium text-slate-700">{userName}</span>
            <button onClick={onLogout} className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 px-2 py-1 hover:bg-slate-100 rounded">로그아웃</button>
          </div>
        </div>
      </div>

      {/* [추가] 사이드바 '새 프로젝트' 버튼 추가 (이전: 메인 화면 상단 키워드 입력창) */}
      {/* Add Task Button */}
      <div className="p-3 sm:p-4">
        <button
          onClick={onAddNewProject}
          className="w-full bg-white text-slate-600 border border-dashed border-slate-300 py-2.5 sm:py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 whitespace-nowrap min-h-[44px] sm:min-h-0 touch-manipulation group"
        >
          <div className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded-full group-hover:bg-indigo-100 transition-colors">
            <i className="ri-add-line text-slate-500 group-hover:text-indigo-600 text-sm"></i>
          </div>
          <span className="text-sm font-medium">새 프로젝트</span>
        </button>
      </div>

      {/* Menu List */}
      <div className="flex-1 px-3 sm:px-4 space-y-1 overflow-y-auto">
        {/* Projects Section */}
        <div className="pt-4 sm:pt-6">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-sm font-medium text-slate-900">프로젝트</span>
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-arrow-down-s-line text-xs text-slate-400"></i>
            </div>
          </div>

          {projects.map(project => {
            /* [개선] 가중치 기반 진행률 계산 - 계층 구조를 고려한 정확한 진행률 */
            const weightedProgress = calculateWeightedProgress(project.items);
            /* [추가] 전체/완료 항목 통계 - 프로젝트 진행 상황 한눈에 파악 */
            const totalItems = countAllItems(project.items);
            const completedItems = countCompletedItems(project.items);
            
            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={`py-2.5 sm:py-2 px-3 rounded-lg cursor-pointer transition-all min-h-[44px] sm:min-h-0 touch-manipulation ${
                  project.id === activeProjectId
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {/* 프로젝트 이름 및 아이콘 */}
                <div className="flex items-center space-x-3 mb-1.5">
                  <span className={`text-sm sm:text-base ${project.id === activeProjectId ? 'text-indigo-500' : 'text-slate-400'} flex-shrink-0`}>#</span>
                  <span className={`text-sm sm:text-base font-medium flex-1 truncate ${project.id === activeProjectId ? 'text-indigo-700' : 'text-slate-700'}`}>
                    {project.keyword}
                  </span>
                  {/* [추가] 완료 체크 표시 - 진행률 100% 달성 시 시각적 피드백 */}
                  {weightedProgress >= 99.9 && (
                    <span className="text-green-500 flex-shrink-0">✓</span>
                  )}
                </div>

                {/* 진행률 바 및 통계 */}
                {totalItems > 0 && (
                  <div className="pl-6 space-y-1">
                    {/* [추가] 가중치 기반 진행률 바 - 계층 구조 반영 */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${
                            weightedProgress >= 99.9
                              ? 'bg-emerald-500' 
                              : project.id === activeProjectId 
                                ? 'bg-indigo-500' 
                                : 'bg-slate-400'
                          }`}
                          style={{ width: `${weightedProgress}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium flex-shrink-0 min-w-[32px] text-right ${
                        weightedProgress >= 99.9
                          ? 'text-emerald-600' 
                          : project.id === activeProjectId 
                            ? 'text-indigo-600' 
                            : 'text-slate-500'
                      }`}>
                        {Math.round(weightedProgress)}%
                      </span>
                    </div>

                    {/* [추가] 완료/전체 항목 수 표시 - 통계 정보 제공 */}
                    <div className="text-xs text-slate-500">
                      {completedItems}/{totalItems} 항목
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Menu */}
      <div className="p-3 sm:p-4 border-t border-slate-100 space-y-2">
        <div className="flex items-center space-x-3 py-2.5 sm:py-2 px-3 rounded hover:bg-slate-100 active:bg-slate-200 cursor-pointer min-h-[44px] sm:min-h-0 touch-manipulation">
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <i className="ri-question-line text-slate-600 text-lg sm:text-base"></i>
          </div>
          <span className="text-sm sm:text-base text-slate-700">도움말 & 리소스</span>
        </div>
      </div>
      
      {/* Resize Handle - 데스크톱에서만 표시 */}
      <div
        onMouseDown={handleMouseDown}
        className="hidden lg:block absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-slate-300 transition-colors"
      />
    </div>
  );
};

export default Sidebar;
