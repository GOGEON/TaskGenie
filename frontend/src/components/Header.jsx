/**
 * 상단 바 컴포넌트
 *
 * 현재 프로젝트 위치 표시, 할 일 추가(Ctrl/⌘ K), 프로젝트 삭제.
 * 동작하지 않는 장식용 아이콘은 두지 않는다.
 *
 * @module Header
 */
import React from 'react';
import { RiMenuLine, RiAddLine, RiDeleteBinLine } from 'react-icons/ri';

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');

const Header = ({ activeProject, onDeleteProject, onToggleSidebar, onOpenQuickAdd }) => {
  const projectName = activeProject ? activeProject.keyword : null;

  return (
    <div className="flex h-14 flex-shrink-0 items-center border-b border-rule bg-paper px-3 sm:px-6">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* 모바일 메뉴 버튼 */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="-ml-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded text-ink-2 hover:bg-paper-2 lg:hidden"
            aria-label="메뉴 열기"
          >
            <RiMenuLine className="text-xl" />
          </button>

          <nav aria-label="현재 위치" className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden flex-shrink-0 text-ink-3 sm:inline">프로젝트</span>
            <span className="hidden flex-shrink-0 text-ink-4 sm:inline" aria-hidden="true">/</span>
            <span className="truncate font-medium text-ink">{projectName || '프로젝트를 선택하세요'}</span>
          </nav>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
          {onOpenQuickAdd && (
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="flex h-9 items-center gap-2 rounded bg-ink px-3 text-sm font-medium text-paper transition-colors hover:bg-ink-2"
              title={`할 일 추가 (${isMac ? '⌘' : 'Ctrl'} K)`}
            >
              <RiAddLine className="text-base" aria-hidden="true" />
              <span className="hidden sm:inline">할 일 추가</span>
              <span className="kbd hidden text-paper/70 lg:inline-flex">{isMac ? '⌘K' : 'Ctrl K'}</span>
            </button>
          )}

          {activeProject && onDeleteProject && (
            <button
              type="button"
              onClick={() => onDeleteProject(activeProject.id)}
              className="flex h-9 w-9 items-center justify-center rounded text-ink-3 transition-colors hover:bg-accent-wash hover:text-accent-ink"
              title="프로젝트 삭제"
              aria-label="프로젝트 삭제"
            >
              <RiDeleteBinLine className="text-lg" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
