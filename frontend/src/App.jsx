import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import SocialCallbackPage from './pages/SocialCallbackPage';
import MainLayout from './components/MainLayout';
/* [추가] 최초 방문 사용자를 위한 온보딩 가이드 컴포넌트 추가 */
import OnboardingGuide from './components/OnboardingGuide';
/* [추가] 프로젝트/작업 없을 때 표시할 빈 상태 컴포넌트 추가 */
import EmptyState from './components/EmptyState';
/* [추가] 기본 prompt() 대신 사용할 전문적인 키워드 입력 모달 컴포넌트 추가 */
import KeywordInputModal from './components/KeywordInputModal';
/* [추가] 전역 빠른 추가 모달 컴포넌트 추가 (Ctrl/Cmd + K) - AI 파싱 없이 즉시 생성 */
import QuickAddModal from './components/QuickAddModal';

import { loadToken, removeToken } from './services/localStorageService';
import { getToDos, generateToDoList, deleteToDoList } from './services/todoApiService';
/* [추가] 전역 키보드 단축키 훅 추가 */
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';

import './App.css';

function App() {
  const [token, setToken] = useState(loadToken());
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  /* [추가] 키워드 입력 모달의 열림/닫힘 상태 관리 (이전: prompt() 사용) */
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
  /* [추가] 빠른 추가 모달의 열림/닫힘 상태 관리 (Ctrl/Cmd + K) */
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const triggerRefetch = () => setRefetchTrigger(c => c + 1);

  /* [추가] Ctrl/Cmd + K 단축키로 빠른 추가 모달 열기 */
  useKeyboardShortcuts('k', () => {
    if (user && projects.length > 0) {
      setIsQuickAddOpen(true);
    }
  }, { ctrl: true });

  useEffect(() => {
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
      } catch (error) {
        console.error("Invalid token:", error);
        handleLogout();
      }
    } else {
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      const fetchProjects = async () => {
        try {
          const response = await getToDos();
          setProjects(response);
          if (response.length > 0 && !activeProjectId) {
            setActiveProjectId(response[0].id);
          }
        } catch (err) {
          console.error('Failed to fetch projects:', err);
          toast.error('프로젝트 목록을 가져오는데 실패했습니다.');
        }
      };
      fetchProjects();
    }
  }, [user, activeProjectId, refetchTrigger]);

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    triggerRefetch(); // 로그인 성공 시 데이터 조회
  };

  const handleLogout = () => {
    removeToken();
    setToken(null);
    setUser(null);
    setProjects([]);
    setActiveProjectId(null);
  };

  const handleSelectProject = (projectId) => {
    setActiveProjectId(projectId);
  };

  /* [수정] 프로젝트 추가 로직을 모달 방식으로 변경 (이전: prompt() 직접 호출) */
  const handleAddNewProject = () => {
    setIsKeywordModalOpen(true);
  };

  /* [추가] 모달에서 키워드 제출 시 프로젝트 생성 처리 */
  const handleKeywordSubmit = async (keyword) => {
    try {
      /* [개선] toast.promise로 로딩/성공/실패 상태를 사용자에게 표시 */
      const newProject = await toast.promise(
        generateToDoList(keyword),
        {
          loading: 'AI가 할 일 목록을 생성하는 중입니다...',
          success: '프로젝트가 생성되었습니다!',
          error: '프로젝트 생성에 실패했습니다.',
        }
      );
      
      // 새 프로젝트 목록 조회
      triggerRefetch();
      
      /* [개선] 새로 생성된 프로젝트를 자동으로 활성화하여 바로 작업 가능하도록 개선 */
      if (newProject && newProject.id) {
        setActiveProjectId(newProject.id);
      }
      
      /* [추가] 성공 시 모달 자동 닫기 */
      setIsKeywordModalOpen(false);
    } catch (error) {
      console.error('프로젝트 생성 실패:', error);
      /* [개선] 에러 시 모달은 열어둠 - 사용자가 재시도할 수 있도록 */
    }
  };

  /* [추가] 빠른 추가 모달에서 작업 추가 처리 - AI 파싱 없이 직접 생성 */
  const handleQuickAddSubmit = async (text, projectId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/todos/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loadToken()}`
        },
        body: JSON.stringify({
          description: text,
          list_id: projectId,
          priority: 'none',
          due_date: null
        })
      });
      
      if (!response.ok) {
        throw new Error('작업 추가 실패');
      }
      
      toast.success('작업이 추가되었습니다!');
      triggerRefetch();
      setIsQuickAddOpen(false);
    } catch (error) {
      console.error('작업 추가 실패:', error);
      toast.error('작업 추가에 실패했습니다.');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('이 프로젝트를 정말로 삭제하시겠습니까?')) {
      try {
        await toast.promise(deleteToDoList(projectId), {
          loading: '프로젝트를 삭제하는 중입니다...',
          success: '프로젝트가 성공적으로 삭제되었습니다!',
          error: '프로젝트 삭제에 실패했습니다.',
        });
        // 삭제 성공 후 전체 프로젝트 목록 재조회
        triggerRefetch();
        // 삭제된 프로젝트가 현재 활성 프로젝트라면 다른 프로젝트로 전환
        if (projectId === activeProjectId) {
          setActiveProjectId(null);
        }
      } catch (error) {
        console.error('프로젝트 삭제 실패:', error);
      }
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div>
      <Toaster />
      {/* [추가] 최초 방문 시 사용 방법을 안내하는 온보딩 가이드 표시 */}
      <OnboardingGuide />
      <KeywordInputModal 
        isOpen={isKeywordModalOpen}
        onClose={() => setIsKeywordModalOpen(false)}
        onSubmit={handleKeywordSubmit}
      />
      {/* [추가] 전역 빠른 추가 모달 (Ctrl/Cmd + K) - AI 파싱 없이 즉시 생성 */}
      <QuickAddModal 
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSubmit={handleQuickAddSubmit}
        projects={projects}
        activeProjectId={activeProjectId}
      />
      <Router>
        <Routes>
          <Route 
            path="/auth" 
            element={token ? <Navigate to="/" /> : <AuthPage onLoginSuccess={handleLoginSuccess} />}
          />
          <Route 
            path="/auth/naver/callback" 
            element={<SocialCallbackPage onLoginSuccess={handleLoginSuccess} />}
          />
          <Route 
            path="/auth/kakao/callback" 
            element={<SocialCallbackPage onLoginSuccess={handleLoginSuccess} />}
          />
          <Route 
            path="/*" 
            element={
              token ? (
                <MainLayout
                  user={user}
                  projects={projects}
                  activeProject={activeProject}
                  onSelectProject={handleSelectProject}
                  onAddNewProject={handleAddNewProject}
                  onDeleteProject={handleDeleteProject}
                  onLogout={handleLogout}
                  triggerRefetch={triggerRefetch}
                >
                  {activeProject ? (
                    <HomePage 
                      key={activeProject.id}
                      project={activeProject} 
                      setProjects={setProjects} 
                      triggerRefetch={triggerRefetch}
                    />
                  ) : projects.length === 0 ? (
                    /* [추가] 프로젝트가 없을 때 친근한 안내와 CTA 버튼을 제공하는 EmptyState */
                    <EmptyState 
                      type="projects"
                      onAction={handleAddNewProject}
                    />
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <p>프로젝트를 선택하거나 새로 만들어주세요.</p>
                    </div>
                  )}
                </MainLayout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

