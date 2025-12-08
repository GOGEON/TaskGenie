/**
 * 사이드바 컴포넌트
 * 
 * 앱 좌측에 위치한 네비게이션 사이드바.
 * 사용자 정보, 프로젝트 목록, 진행률을 표시.
 * 
 * 주요 기능:
 * - 사용자 정보 표시 및 로그아웃
 * - 프로젝트 목록 및 선택
 * - 가중치 기반 진행률 계산 (계층 구조 고려)
 * - 완료/전체 항목 통계 표시
 * - 리사이즈 가능한 너비 (데스크톱)
 * 
 * @module Sidebar
 */
import React, { useState, useEffect, useRef } from 'react';


/**
 * 사이드바 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {Object} props.user - 현재 로그인 사용자 정보
 * @param {Array} props.projects - 프로젝트 목록
 * @param {string} props.activeProjectId - 현재 선택된 프로젝트 ID
 * @param {Function} props.onSelectProject - 프로젝트 선택 콜백
 * @param {Function} props.onAddNewProject - 새 프로젝트 추가 콜백
 * @param {Function} props.onLogout - 로그아웃 콜백
 * @returns {JSX.Element} 사이드바 요소
 */
const Sidebar = ({ user, projects, activeProjectId, onSelectProject, onAddNewProject, onLogout }) => {
  // ==================== 컴포넌트 상태 ====================
  const [width, setWidth] = useState(320);        // 사이드바 너비 (픽셀)
  const [isResizing, setIsResizing] = useState(false);  // 리사이즈 중 여부
  const sidebarRef = useRef(null);

  const userName = user?.username || '사용자';
  const userInitial = userName.charAt(0).toUpperCase();


  /**
   * 가중치 기반 진행률 계산.
   * 
   * 계층 구조를 고려하여 각 레벨의 항목이 동등한 비중을 가지도록 계산.
   * 단순 완료/전체 카운트 방식과 달리, 자식 항목의 깊이에 관계없이
   * 루트 항목 기준으로 공정하게 진행률 반영.
   * 
   * @param {Array} items - 할 일 항목 목록
   * @returns {number} 진행률 (0-100)
   */
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


  /**
   * 모든 항목 수 재귀 카운트.
   * 자식 항목까지 포함한 전체 항목 수 계산.
   * 
   * @param {Array} items - 할 일 항목 목록
   * @returns {number} 전체 항목 수
   */
  const countAllItems = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((total, item) => {
      return total + 1 + countAllItems(item.children);
    }, 0);
  };


  /**
   * 완료된 항목 수 재귀 카운트.
   * 자식 항목까지 포함한 완료 항목 수 계산.
   * 
   * @param {Array} items - 할 일 항목 목록
   * @returns {number} 완료된 항목 수
   */
  const countCompletedItems = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((total, item) => {
      const isCompleted = item.is_completed ? 1 : 0;
      return total + isCompleted + countCompletedItems(item.children);
    }, 0);
  };


  // ==================== 리사이즈 이벤트 핸들러 ====================
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


  /** 리사이즈 시작 핸들러 */
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
                    <span className="text-emerald-500 flex-shrink-0">✓</span>
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
        {/* [추가] 회원탈퇴 버튼 */}
        <div 
          onClick={async () => {
            const confirmFirst = window.confirm('정말로 회원탈퇴를 하시겠습니까?\n\n모든 프로젝트와 할 일 데이터가 영구적으로 삭제됩니다.');
            if (!confirmFirst) return;
            
            const confirmSecond = window.confirm('⚠️ 최종 확인\n\n이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?');
            if (!confirmSecond) return;
            
            try {
              const api = (await import('../services/api')).default;
              await api.delete('/auth/me');
              alert('회원탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
              onLogout();
            } catch (error) {
              console.error('Failed to delete account:', error);
              alert('회원탈퇴에 실패했습니다. 다시 시도해주세요.');
            }
          }}
          className="flex items-center space-x-3 py-2.5 sm:py-2 px-3 rounded hover:bg-red-50 active:bg-red-100 cursor-pointer min-h-[44px] sm:min-h-0 touch-manipulation group"
        >
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <i className="ri-user-unfollow-line text-slate-400 group-hover:text-red-500 text-lg sm:text-base"></i>
          </div>
          <span className="text-sm sm:text-base text-slate-500 group-hover:text-red-600">회원탈퇴</span>
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
