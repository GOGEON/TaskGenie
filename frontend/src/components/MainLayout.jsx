import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Sidebar from './Sidebar';
import Header from './Header';
import CustomDragLayer from './CustomDragLayer';

const MainLayout = ({ 
  user, 
  projects, 
  activeProject, 
  onSelectProject, 
  onAddNewProject, 
  onLogout,
  onDeleteProject,
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
