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
import { RiAddLine, RiCloseLine, RiQuestionLine } from 'react-icons/ri';
import Wordmark from './Wordmark';
import { calculateProgress, countAllItems, countCompletedItems } from '../utils/treeUtils';
import { deleteAccount } from '../services/authApiService';
import { getDisplayName, getInitial } from '../utils/displayName';

/** 진행률이 사실상 100%인지 (부동소수 오차 허용) */
const isFullyComplete = (progress) => progress >= 99.9;


/**
 * 사이드바의 프로젝트 항목 (이름, 가중치 진행률, 완료/전체 항목 수).
 *
 * @param {Object} props.project - 프로젝트
 * @param {boolean} props.isActive - 현재 선택된 프로젝트 여부
 * @param {Function} props.onSelect - 선택 콜백
 */
const ProjectListItem = ({ project, isActive, onSelect }) => {
  const progress = calculateProgress(project.items);
  const totalItems = countAllItems(project.items);
  const completedItems = countCompletedItems(project.items);
  const isDone = totalItems > 0 && isFullyComplete(progress);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(project.id)}
        aria-current={isActive ? 'page' : undefined}
        className={`relative block w-full rounded px-3 py-2.5 text-left transition-colors touch-manipulation ${
          isActive ? 'bg-sheet shadow-sheet' : 'hover:bg-paper-3/60'
        }`}
      >
        {isActive && (
          <span className="absolute inset-y-2 left-0 w-[2px] bg-accent" aria-hidden="true" />
        )}
        <span className="flex items-baseline gap-3">
          <span className={`flex-1 truncate text-sm ${isActive ? 'font-semibold text-ink' : 'text-ink-2'}`}>
            {project.keyword}
          </span>
          {totalItems > 0 && (
            <span className={`flex-shrink-0 font-mono text-[11px] tabular ${isDone ? 'text-moss' : 'text-ink-3'}`}>
              {isDone ? '완료' : `${completedItems}/${totalItems}`}
            </span>
          )}
        </span>

        {totalItems > 0 && (
          <span className="mt-2 block h-[2px] w-full bg-rule" aria-hidden="true">
            <span
              className={`block h-full transition-[width] duration-500 ${
                isDone ? 'bg-moss' : isActive ? 'bg-ink' : 'bg-ink-4'
              }`}
              style={{ width: `${progress}%` }}
            />
          </span>
        )}
      </button>
    </li>
  );
};


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
 * @param {Function} props.onOpenHelp - 사용법 안내 열기 콜백
 * @param {Function} props.onCloseMobile - 모바일 사이드바 닫기 콜백
 * @returns {JSX.Element} 사이드바 요소
 */
const Sidebar = ({ user, projects, activeProjectId, onSelectProject, onAddNewProject, onLogout, onOpenHelp, onCloseMobile }) => {
  // ==================== 컴포넌트 상태 ====================
  const [width, setWidth] = useState(288);        // 사이드바 너비 (픽셀)
  const [isResizing, setIsResizing] = useState(false);  // 리사이즈 중 여부
  const sidebarRef = useRef(null);

  const userName = getDisplayName(user);
  const userInitial = getInitial(userName);


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

  /** 회원탈퇴 (2단계 확인) */
  const handleDeleteAccount = async () => {
    const confirmFirst = window.confirm('정말로 회원탈퇴를 하시겠습니까?\n\n모든 프로젝트와 할 일 데이터가 영구적으로 삭제됩니다.');
    if (!confirmFirst) return;

    const confirmSecond = window.confirm('최종 확인\n\n이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?');
    if (!confirmSecond) return;

    try {
      await deleteAccount();
      alert('회원탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
      onLogout();
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('회원탈퇴에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className="relative flex h-screen max-w-[85vw] flex-col border-r border-rule bg-paper-2 lg:max-w-none"
    >
      {/* 로고 */}
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-rule px-4">
        <Wordmark size="sm" />
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded text-ink-3 hover:bg-paper-3 hover:text-ink lg:hidden"
            aria-label="메뉴 닫기"
          >
            <RiCloseLine className="text-lg" />
          </button>
        )}
      </div>

      {/* 새 프로젝트 */}
      <div className="px-3 pt-4">
        <button
          type="button"
          onClick={onAddNewProject}
          className="flex min-h-[40px] w-full items-center gap-2 rounded border border-rule-strong bg-sheet px-3 text-sm font-medium text-ink transition-colors hover:border-ink"
        >
          <RiAddLine className="text-base" aria-hidden="true" />
          새 프로젝트
        </button>
      </div>

      {/* 프로젝트 목록 */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-6">
        <div className="mb-2 flex items-baseline justify-between px-2">
          <span className="text-xs font-medium text-ink-3">프로젝트</span>
          <span className="font-mono text-[11px] text-ink-4 tabular">{projects.length}</span>
        </div>

        <ul className="space-y-px">
          {projects.map(project => (
            <ProjectListItem
              key={project.id}
              project={project}
              isActive={project.id === activeProjectId}
              onSelect={onSelectProject}
            />
          ))}
        </ul>
      </div>

      {/* 하단: 사용자 / 도움말 / 탈퇴 */}
      <div className="border-t border-rule px-3 py-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs font-medium text-paper">
            {userInitial}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{userName}</span>
          <button
            type="button"
            onClick={onLogout}
            className="flex-shrink-0 rounded px-2 py-1 text-xs text-ink-3 hover:bg-paper-3 hover:text-ink"
          >
            로그아웃
          </button>
        </div>
        <div className="mt-1 flex items-center gap-1 px-1">
          <button
            type="button"
            onClick={onOpenHelp}
            className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs text-ink-3 hover:bg-paper-3 hover:text-ink"
          >
            <RiQuestionLine aria-hidden="true" />
            도움말
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="ml-auto inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs text-ink-4 hover:bg-accent-wash hover:text-accent-ink"
          >
            회원탈퇴
          </button>
        </div>
      </div>

      {/* 너비 조절 핸들 — 데스크톱 */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute right-0 top-0 hidden h-full w-1.5 cursor-col-resize transition-colors hover:bg-rule-strong lg:block"
        aria-hidden="true"
      />
    </div>
  );
};

export default Sidebar;
