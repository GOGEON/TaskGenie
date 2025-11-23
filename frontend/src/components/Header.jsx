/* [추가] Quick Add 버튼을 위한 onOpenQuickAdd prop 추가 */
import React from 'react';

const Header = ({ activeProject, onDeleteProject, onToggleSidebar, onOpenQuickAdd }) => {
  const projectName = activeProject ? activeProject.keyword : '프로젝트를 선택하세요';

  return (
    <div className="h-[72px] bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center flex-shrink-0">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {/* Mobile Menu Button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded transition-colors flex-shrink-0"
            aria-label="메뉴 열기"
          >
            <i className="ri-menu-line text-slate-600 text-xl"></i>
          </button>
          
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 hidden sm:flex">
            <i className="ri-book-line text-slate-400"></i>
          </div>
          <span className="text-sm text-slate-500 hidden sm:inline">프로젝트 /</span>
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-base sm:text-lg font-medium text-slate-900 truncate">{projectName}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
          {/* [추가] Quick Add 버튼 - 주요 CTA */}
          {onOpenQuickAdd && (
            <button
              onClick={onOpenQuickAdd}
              className="quick-add-btn bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center space-x-1.5 sm:space-x-2 transition-all hover-lift shadow-md hover:shadow-lg min-h-[36px]"
              title="빠른 추가 (Ctrl/Cmd + K)"
            >
              <i className="ri-add-line text-lg sm:text-base"></i>
              <span className="hidden sm:inline text-sm font-medium">빠른 추가</span>
              <span className="hidden lg:inline text-xs opacity-75 ml-1">⌘K</span>
            </button>
          )}
          
          {activeProject && onDeleteProject && (
            <button
              onClick={() => onDeleteProject(activeProject.id)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-red-50 rounded transition-all hover-lift"
              title="프로젝트 삭제"
            >
              <i className="ri-delete-bin-line text-red-400 hover:text-red-600 text-lg sm:text-xl transition-colors"></i>
            </button>
          )}
          <div className="hidden md:flex w-8 h-8 items-center justify-center hover:bg-slate-100 rounded cursor-pointer transition-all hover-lift">
            <i className="ri-notification-line text-slate-400 hover:text-slate-600 transition-colors"></i>
          </div>
          <div className="hidden md:flex w-8 h-8 items-center justify-center hover:bg-slate-100 rounded cursor-pointer transition-all hover-lift">
            <i className="ri-share-line text-slate-400 hover:text-slate-600 transition-colors"></i>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-slate-100 rounded cursor-pointer transition-all hover-lift">
            <i className="ri-more-line text-slate-400 hover:text-slate-600 text-lg sm:text-xl transition-colors"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
