import React from 'react';

const Header = ({ activeProject, onDeleteProject, onToggleSidebar }) => {
  const projectName = activeProject ? activeProject.keyword : '프로젝트를 선택하세요';

  return (
    <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {/* Mobile Menu Button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors flex-shrink-0"
            aria-label="메뉴 열기"
          >
            <i className="ri-menu-line text-gray-600 text-xl"></i>
          </button>
          
          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 hidden sm:flex">
            <i className="ri-book-line text-gray-400"></i>
          </div>
          <span className="text-sm text-gray-500 hidden sm:inline">프로젝트 /</span>
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-base sm:text-lg font-medium text-gray-900 truncate">{projectName}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
          {activeProject && onDeleteProject && (
            <button
              onClick={() => onDeleteProject(activeProject.id)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-red-50 rounded transition-all hover-lift"
              title="프로젝트 삭제"
            >
              <i className="ri-delete-bin-line text-red-400 hover:text-red-600 text-lg sm:text-xl transition-colors"></i>
            </button>
          )}
          <div className="hidden md:flex w-8 h-8 items-center justify-center hover:bg-gray-100 rounded cursor-pointer transition-all hover-lift">
            <i className="ri-notification-line text-gray-400 hover:text-gray-600 transition-colors"></i>
          </div>
          <div className="hidden md:flex w-8 h-8 items-center justify-center hover:bg-gray-100 rounded cursor-pointer transition-all hover-lift">
            <i className="ri-share-line text-gray-400 hover:text-gray-600 transition-colors"></i>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-gray-100 rounded cursor-pointer transition-all hover-lift">
            <i className="ri-more-line text-gray-400 hover:text-gray-600 text-lg sm:text-xl transition-colors"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
