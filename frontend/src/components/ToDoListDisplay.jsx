/**
 * 할 일 목록 표시 컴포넌트
 * 
 * 프로젝트의 전체 할 일 목록을 렌더링하고 관리하는 컨테이너 컴포넌트.
 * 진행률 계산, 목록 제목 수정, 개별 아이템 렌더링을 담당.
 * 
 * 주요 기능:
 * - 계층적 진행률 계산 (가중치 기반)
 * - 프로젝트 제목 인라인 수정
 * - 할 일 아이템 목록 렌더링
 * - 빈 상태(EmptyState) 처리
 * 
 * @module ToDoListDisplay
 */
import React, { useState } from 'react';
import ToDoItem from './ToDoItem';
import ProgressBar from './ProgressBar';
import SkeletonToDoItem from './SkeletonToDoItem';
import EmptyState from './EmptyState';
import { calculateProgress, countAllItems, countCompletedItems } from '../utils/treeUtils';


/**
 * ToDoListDisplay 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {Object} props.todoList - 표시할 프로젝트 객체 (items, keyword 포함)
 * @param {Function} props.moveItem - 아이템 이동 핸들러 (DnD)
 * @param {Function} props.onDropItem - 아이템 드롭 핸들러
 * @param {Function} props.onToggleItemComplete - 완료 상태 토글 핸들러
 * @param {Function} props.onOpenContextMenu - 컨텍스트 메뉴 오픈 핸들러
 * @param {string} props.generatingItemId - 생성 중인 아이템 ID
 * @param {Function} props.onUpdateKeyword - 프로젝트 제목 수정 핸들러
 * @param {Function} props.onOpenQuickAdd - 빠른 추가 모달 오픈 핸들러
 * @returns {JSX.Element} 할 일 목록 뷰
 */
function ToDoListDisplay({
  todoList,
  moveItem,
  onDropItem,
  onToggleItemComplete,
  onOpenContextMenu,
  generatingItemId,
  onUpdateKeyword, /* [추가] 프로젝트 키워드 수정 핸들러 */
  onOpenQuickAdd, /* [추가] 빠른 추가 모달 열기 핸들러 */
}) {
  /* [추가] 키워드 인라인 수정 기능 상태 관리 */
  const [isEditingKeyword, setIsEditingKeyword] = useState(false);
  const [editedKeyword, setEditedKeyword] = useState(todoList.keyword);


  /* [추가] 키워드 수정 모드 진입 */
  const handleKeywordClick = () => {
    setIsEditingKeyword(true);
    setEditedKeyword(todoList.keyword);
  };

  /* [추가] 키워드 수정 저장 - 변경사항이 있을 때만 API 호출 */
  const handleKeywordSave = () => {
    if (editedKeyword.trim() && editedKeyword !== todoList.keyword) {
      onUpdateKeyword(editedKeyword.trim());
    }
    setIsEditingKeyword(false);
  };

  /* [추가] 키워드 수정 취소 - 원래 값으로 복원 */
  const handleKeywordCancel = () => {
    setEditedKeyword(todoList.keyword);
    setIsEditingKeyword(false);
  };

  /* [추가] 키워드 입력 시 Enter/Escape 키 처리 */
  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleKeywordSave();
    } else if (e.key === 'Escape') {
      handleKeywordCancel();
    }
  };

  if (!todoList || todoList.items.length === 0) {
    return (
      <EmptyState 
        type="tasks"
        title="이 프로젝트는 비어 있습니다"
        description="‘할 일 추가’를 누르거나 Ctrl/⌘ K로 첫 항목을 적어 보세요."
        actionLabel="할 일 추가"
        onAction={onOpenQuickAdd}
      />
    );
  }

  /* 가중치 기반 진행률 */
  const progress = calculateProgress(todoList.items);
  const total = countAllItems(todoList.items);
  const completed = countCompletedItems(todoList.items);

  return (
    <div className="w-full text-left">
      {/* 프로젝트 제목 — 클릭하면 바로 수정 */}
      <div className="-mx-2">
        {isEditingKeyword ? (
          <input
            type="text"
            value={editedKeyword}
            onChange={(e) => setEditedKeyword(e.target.value)}
            onKeyDown={handleKeywordKeyDown}
            onBlur={handleKeywordSave}
            autoFocus
            aria-label="프로젝트 이름"
            className="w-full rounded border border-ink bg-sheet px-2 py-1 font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-ink focus:outline-none sm:text-4xl"
          />
        ) : (
          <h1
            className="cursor-text break-keep rounded border border-transparent px-2 py-1 font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-ink transition-colors hover:border-rule sm:text-4xl"
            onClick={handleKeywordClick}
            title="클릭해서 이름 바꾸기"
          >
            {todoList.keyword}
          </h1>
        )}
      </div>

      <div className="mb-4 mt-4 sm:mb-6">
        <ProgressBar progress={progress} completed={completed} total={total} />
      </div>

      <ul className="list-none border-t border-rule p-0">
        {todoList.items.map((item, index) => (
          <ToDoItem
            key={item.id}
            index={index}
            item={item}
            parentId={null}
            moveItem={moveItem}
            onDropItem={onDropItem}
            onToggleItemComplete={onToggleItemComplete}
            onOpenContextMenu={onOpenContextMenu}
            generatingItemId={generatingItemId}
          />
        ))}
      </ul>
    </div>
  );
}

export default ToDoListDisplay;