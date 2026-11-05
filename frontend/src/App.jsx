/**
 * 앱 루트 컴포넌트
 * 
 * TaskGenie 앱의 최상위 컴포넌트로 다음을 담당:
 * - 라우팅 설정 (React Router)
 * - 인증 상태 관리 (JWT 토큰)
 * - 프로젝트 목록 상태 관리
 * - 전역 모달 관리 (키워드 입력, 빠른 추가)
 * - 전역 키보드 단축키 (Ctrl/Cmd + K)
 * 
 * @module App
 */
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import SocialCallbackPage from './pages/SocialCallbackPage';
import MainLayout from './components/MainLayout';
import OnboardingGuide from './components/OnboardingGuide';
import EmptyState from './components/EmptyState';
import KeywordInputModal from './components/KeywordInputModal';
import QuickAddModal from './components/QuickAddModal';

import { loadToken, removeToken } from './services/localStorageService';
import { getToDos, generateToDoList, deleteToDoList, createToDoItem, generateSubtasks } from './services/todoApiService';
import { parseNaturalLanguage } from './utils/nlpParser';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';

import './App.css';


/**
 * 앱 최상위 컴포넌트.
 * 
 * 앱 전역 상태 및 라우팅을 관리.
 * 
 * @returns {JSX.Element} 앱 루트 요소
 */
function App() {
  // ==================== 상태 관리 ====================
  const [token, setToken] = useState(loadToken());        // JWT 인증 토큰
  const [user, setUser] = useState(null);                 // 디코딩된 사용자 정보
  const [projects, setProjects] = useState([]);           // 프로젝트 목록
  const [activeProjectId, setActiveProjectId] = useState(null);  // 현재 선택된 프로젝트
  const [refetchTrigger, setRefetchTrigger] = useState(0);       // 데이터 재조회 트리거
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);  // AI 프로젝트 생성 모달
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);          // 빠른 추가 모달
  // 온보딩: 처음 로그인했을 때 한 번 자동으로 열고, 사이드바 '도움말'로 다시 열 수 있음
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    try {
      return !localStorage.getItem('hasSeenOnboarding');
    } catch {
      return false;
    }
  });

  /** 프로젝트 목록 재조회 트리거 */
  const triggerRefetch = () => setRefetchTrigger(c => c + 1);

  /**
   * 빠른 추가 모달 열기.
   * 로그인 상태이고 프로젝트가 있을 때만 동작.
   */
  const handleOpenQuickAdd = () => {
    if (user && projects.length > 0) {
      setIsQuickAddOpen(true);
    }
  };

  // Ctrl/Cmd + K 단축키로 빠른 추가 모달 열기
  useKeyboardShortcuts('k', handleOpenQuickAdd, { ctrl: true });

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

  /**
   * 빠른 추가 제출 처리.
   * 클라이언트에서 자연어를 파싱해 즉시 생성하고(AI 없음),
   * 옵션이 켜져 있으면 생성된 작업의 하위 항목을 AI로 생성한다.
   */
  const handleQuickAddSubmit = async (text, projectId, parentId = null, withAiSubtasks = false) => {
    const { description, priority, due_date } = parseNaturalLanguage(text);

    let newItem;
    try {
      newItem = await createToDoItem({ description, list_id: projectId, parent_id: parentId, priority, due_date });
    } catch (error) {
      console.error('작업 추가 실패:', error);
      toast.error('작업 추가에 실패했습니다.');
      return;
    }

    if (withAiSubtasks) {
      // 하위 항목 생성이 실패해도 작업 자체는 추가된 상태이므로 목록은 갱신한다
      await toast.promise(generateSubtasks(newItem.id), {
        loading: 'AI가 하위 항목을 생성하는 중...',
        success: '하위 항목이 생성되었습니다!',
        error: '작업은 추가되었지만 하위 항목 생성에 실패했습니다.',
      }).catch(() => {});
    } else {
      toast.success('작업이 추가되었습니다!');
    }

    triggerRefetch();
    setIsQuickAddOpen(false);
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
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--color-ink)',
            color: 'var(--color-paper)',
            borderRadius: '4px',
            fontSize: '14px',
            padding: '10px 14px',
            boxShadow: 'var(--shadow-pop)',
          },
          success: { iconTheme: { primary: '#8fbf9c', secondary: 'var(--color-ink)' } },
          error: { iconTheme: { primary: '#ec7a62', secondary: 'var(--color-ink)' } },
          loading: { iconTheme: { primary: 'var(--color-paper)', secondary: 'var(--color-ink-2)' } },
        }}
      />
      {/* 온보딩 가이드 — 로그인한 사용자에게만 표시 */}
      {token && (
        <OnboardingGuide
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
        />
      )}
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
                  onOpenQuickAdd={projects.length > 0 ? handleOpenQuickAdd : undefined}
                  onOpenHelp={() => setIsOnboardingOpen(true)}
                  triggerRefetch={triggerRefetch}
                >
                  {activeProject ? (
                    <HomePage 
                      key={activeProject.id}
                      project={activeProject} 
                      setProjects={setProjects} 
                      onOpenQuickAdd={handleOpenQuickAdd}
                    />
                  ) : projects.length === 0 ? (
                    /* [추가] 프로젝트가 없을 때 친근한 안내와 CTA 버튼을 제공하는 EmptyState */
                    <EmptyState 
                      type="projects"
                      onAction={handleAddNewProject}
                    />
                  ) : (
                    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
                      <p className="text-ink-3">왼쪽에서 프로젝트를 고르거나 새로 만드세요.</p>
                    </div>
                  )}
                </MainLayout>
              ) : (
                <LandingPage />
              )
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;

