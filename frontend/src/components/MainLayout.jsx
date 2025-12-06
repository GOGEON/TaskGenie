/**
 * 메인 레이아웃 컴포넌트
 * 
 * 애플리케이션의 전체 레이아웃 구조를 정의.
 * React DnD Provider를 설정하고, 사이드바, 헤더, 메인 콘텐츠 영역을 배치.
 * 모바일 반응형 사이드바 처리를 포함.
 * 
 * @module MainLayout
 */
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Sidebar from './Sidebar';
import Header from './Header';
import CustomDragLayer from './CustomDragLayer';

/* [추가] Quick Add 모달을 열기 위한 onOpenQuickAdd prop 추가 */

/**
 * MainLayout 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {Object} props.user - 로그인한 사용자 정보
 * @param {Array} props.projects - 프로젝트 목록
 * @param {Object} props.activeProject - 현재 활성화된 프로젝트
 * @param {Function} props.onSelectProject - 프로젝트 선택 핸들러
 * @param {Function} props.onAddNewProject - 새 프로젝트 추가 핸들러
 * @param {Function} props.onLogout - 로그아웃 핸들러
 * @param {Function} props.onDeleteProject - 프로젝트 삭제 핸들러
 * @param {Function} props.onOpenQuickAdd - 빠른 추가 모달 열기 핸들러
 * @param {React.ReactNode} props.children - 자식 컴포넌트 (페이지 내용)
 * @returns {JSX.Element} 앱 레이아웃
 */
const MainLayout = ({ 
  user, 
  projects, 
  activeProject, 
  onSelectProject, 
  onAddNewProject, 
  onLogout,
  onDeleteProject,
  onOpenQuickAdd,
  children 
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  return (
    // <!-- [수정] react-dnd 라이브러리 적용을 위한 Provider 추가 -->
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-white font-sans overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar - 모바일에서는 절대 위치, 데스크톱에서는 일반 플로우 */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
          transform transition-transform duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <Sidebar 
            user={user}
            projects={projects}
            activeProjectId={activeProject?.id}
            onSelectProject={(id) => {
              onSelectProject(id);
              setIsMobileSidebarOpen(false);
            }}
            onAddNewProject={onAddNewProject}
            onLogout={onLogout}
          />
        </div>
        
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Header 
            activeProject={activeProject}
            onDeleteProject={onDeleteProject}
            onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            onOpenQuickAdd={onOpenQuickAdd}
          />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
      <CustomDragLayer /> {/* [추가] 커스텀 드래그 레이어 렌더링 */}
    </DndProvider>
  );
};

export default MainLayout;
