/**
 * 할 일 아이템 컴포넌트
 * 
 * 개별 할 일 항목을 렌더링하고 상호작용을 처리.
 * 계층 구조(자식 항목)와 드래그 앤 드롭을 지원.
 * 
 * 주요 기능:
 * - 드래그 앤 드롭으로 순서 변경 (react-dnd)
 * - 체크박스로 완료 상태 토글
 * - 우선순위 표시 (색상으로 구분)
 * - 마감일 표시 (색상 코딩: 과기/임박/일반)
 * - 자식 항목 접기/펼치기
 * - 컨텍스트 메뉴 (수정/삭제/서브태스크 생성)
 * 
 * @module ToDoItem
 */
import React, { useState, useRef, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { 
  RiDraggable, 
  RiMore2Fill, 
  RiArrowDownSLine, 
  RiArrowRightSLine, 
  RiCheckLine,
  RiCalendarLine
} from 'react-icons/ri';
import SkeletonToDoItem from './SkeletonToDoItem';

// 드래그 앤 드롭 아이템 타입 상수
const ItemType = 'TODO_ITEM';


/**
 * 할 일 아이템 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {Object} props.item - 할 일 아이템 데이터
 * @param {number} props.index - 현재 항목의 인덱스
 * @param {Function} props.moveItem - 드래그로 순서 변경 콜백
 * @param {Function} props.onDropItem - 드래그 완료 후 저장 콜백
 * @param {Function} props.onToggleItemComplete - 완료 상태 토글 콜백
 * @param {Function} props.onOpenContextMenu - 컨텍스트 메뉴 열기 콜백
 * @param {Function} props.onGenerateSubtasks - AI 서브태스크 생성 콜백
 * @param {Function} props.onEditItem - 항목 수정 콜백
 * @param {Function} props.onDeleteItem - 항목 삭제 콜백
 * @param {Function} props.onUpdatePriority - 우선순위 변경 콜백
 * @param {boolean} props.isPreview - 드래그 미리보기 여부
 * @param {string} props.parentId - 부모 항목 ID (null이면 루트)
 * @param {boolean} props.isGenerating - AI 생성 중 여부
 * @param {string} props.generatingItemId - AI 생성 중인 항목 ID
 * @returns {JSX.Element} 할 일 아이템 요소
 */
const ToDoItem = ({
  item,
  index,
  moveItem,
  onDropItem,
  onToggleItemComplete,
  onOpenContextMenu,
  onGenerateSubtasks,
  onEditItem,
  onDeleteItem,
  onUpdatePriority,
  isPreview = false,
  parentId = null,
  isGenerating = false,
  generatingItemId = null,
}) => {
  // ==================== 컴포넌트 상태 ====================
  const ref = useRef(null);
  const [isChildrenVisible, setIsChildrenVisible] = useState(true);   // 자식 표시 여부
  const wasChildrenVisibleBeforeDrag = useRef(false);                 // 드래그 전 자식 표시 상태
  const [isDeleting, setIsDeleting] = useState(false);                // 삭제 애니메이션 중

  const hasChildren = item.children && item.children.length > 0;

  const [, drop] = useDrop({
    accept: ItemType,
    canDrop: () => !isPreview,
    hover(draggedItem, monitor) {
      if (!ref.current || isPreview) return;
      
      // 같은 부모를 가진 항목끼리만 순서 변경 가능
      if (draggedItem.parentId !== parentId) return;
      
      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveItem(dragIndex, hoverIndex, parentId);
      draggedItem.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemType,
    item: () => {
      wasChildrenVisibleBeforeDrag.current = isChildrenVisible;
      if (hasChildren && isChildrenVisible) {
        setIsChildrenVisible(false);
      }
      return { ...item, index, parentId };
    },
    canDrag: !isPreview,
    end: (item, monitor) => {
      if (hasChildren && wasChildrenVisibleBeforeDrag.current) {
        setIsChildrenVisible(true);
      }
      
      if (monitor.didDrop()) {
        onDropItem();
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [dragPreview]);

  const opacity = isDragging ? 0 : 1;
  
  drop(ref);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.bottom;
    onOpenContextMenu(x, y, item.id, item.priority || 'none', item.due_date);
  };

  const handleToggleComplete = (e) => {
    e.stopPropagation();
    onToggleItemComplete(item.id, !item.is_completed);
  };

  const handlePriorityChange = (newPriority) => {
    if (onUpdatePriority) {
      onUpdatePriority(item.id, newPriority);
    }
  };

  /* 우선순위 = 체크박스 테두리 색. 완료되면 모두 먹색으로 채움 */
  const priorityConfig = {
    none: { box: 'border-ink-4 bg-sheet', hoverCheck: 'group-hover/checkbox:text-ink-4' },
    low: { box: 'border-blueink bg-blueink-wash/60', hoverCheck: 'group-hover/checkbox:text-blueink' },
    medium: { box: 'border-ochre bg-ochre-wash/60', hoverCheck: 'group-hover/checkbox:text-ochre' },
    high: { box: 'border-accent bg-accent-wash/70', hoverCheck: 'group-hover/checkbox:text-accent' },
  };
  const currentPriorityConfig = priorityConfig[item.priority || 'none'] || priorityConfig.none;

  /* 마감일 표기 */
  const renderDueDate = () => {
    if (!item.due_date) return null;
    const dueDate = new Date(item.due_date);
    const now = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const isDateOnly = dueDate.getHours() === 0 && dueDate.getMinutes() === 0 && dueDate.getSeconds() === 0;

    const pad = (n) => String(n).padStart(2, '0');
    const label = isDateOnly
      ? `${dueDate.getMonth() + 1}.${dueDate.getDate()}`
      : `${dueDate.getMonth() + 1}.${dueDate.getDate()} ${pad(dueDate.getHours())}:${pad(dueDate.getMinutes())}`;

    let tone = 'bg-paper-2 text-ink-3';
    let title = '마감일';
    if (item.is_completed) {
      tone = 'text-ink-4';
    } else if (dueDate < now) {
      tone = 'bg-accent-wash text-accent-ink';
      title = '마감일 지남';
    } else if (dueDate < tomorrow) {
      tone = 'bg-ochre-wash text-ochre';
      title = '마감 임박';
    }

    return (
      <span
        className={`mt-[3px] inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-sm px-1.5 py-0.5 font-mono text-[11px] leading-4 tabular ${tone}`}
        title={title}
      >
        <RiCalendarLine aria-hidden="true" className="text-[11px]" />
        {label}
      </span>
    );
  };

  return (
    <>
      <li
        ref={ref}
        style={{ opacity: isDeleting ? 0 : (isDragging ? 0 : 1) }}
        className={`
          group flex items-start justify-between border-b border-rule/70 py-1.5 pr-1 touch-manipulation
          transition-colors animate-row-in
          ${isPreview ? 'max-w-2xl rounded-md border border-rule bg-sheet shadow-pop' : 'hover:bg-paper-2/50'}
        `}
      >
        <div className="flex min-w-0 flex-grow items-start">
          {/* 드래그 핸들 */}
          <div
            ref={drag}
            className="mt-[3px] hidden flex-shrink-0 cursor-grab p-1 text-ink-4 hover:text-ink-2 sm:invisible sm:block sm:group-hover:visible"
            aria-label="끌어서 순서 바꾸기"
          >
            <RiDraggable className="text-base" />
          </div>

          {/* 펼치기/접기 */}
          <div className="w-7 flex-shrink-0 text-center">
            {hasChildren && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChildrenVisible(!isChildrenVisible);
                }}
                className="flex h-8 w-7 items-center justify-center rounded text-ink-3 hover:bg-paper-3/70 hover:text-ink"
                aria-label={isChildrenVisible ? '하위 항목 접기' : '하위 항목 펼치기'}
                aria-expanded={isChildrenVisible}
              >
                {isChildrenVisible ? <RiArrowDownSLine className="text-lg" /> : <RiArrowRightSLine className="text-lg" />}
              </button>
            )}
          </div>

          {/* 체크박스 (테두리 색 = 우선순위) */}
          <button
            type="button"
            className="group/checkbox relative flex h-8 flex-shrink-0 items-center justify-center px-1 focus:outline-none"
            onClick={handleToggleComplete}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggleComplete(e);
              }
            }}
            aria-label={item.is_completed ? '완료 취소' : '완료로 표시'}
            role="checkbox"
            aria-checked={item.is_completed}
          >
            <span
              className={`
                flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border-[1.5px] transition-colors
                group-focus-visible/checkbox:outline-2 group-focus-visible/checkbox:outline-offset-2 group-focus-visible/checkbox:outline-ink
                ${item.is_completed ? 'border-ink-3 bg-ink-3 text-paper' : `${currentPriorityConfig.box} text-transparent ${currentPriorityConfig.hoverCheck}`}
              `}
            >
              <RiCheckLine className="h-3.5 w-3.5" />
            </span>
          </button>

          {/* 내용 */}
          <span
            className={`ml-1.5 min-w-0 flex-grow break-words py-[5px] pr-2 text-[15px] leading-[22px] ${
              item.is_completed ? 'strike-pen text-ink-4' : 'text-ink'
            }`}
          >
            {item.description}
          </span>

          {renderDueDate()}
        </div>

        {/* 더보기 메뉴 */}
        <div className="ml-1 flex-shrink-0 sm:invisible sm:group-hover:visible sm:group-focus-within:visible">
          <button
            type="button"
            onClick={handleMenuClick}
            disabled={isPreview}
            className="flex h-8 w-8 items-center justify-center rounded text-ink-3 hover:bg-paper-3/70 hover:text-ink disabled:cursor-default touch-manipulation"
            aria-label="항목 메뉴"
          >
            <RiMore2Fill />
          </button>
        </div>
      </li>

      {hasChildren && isChildrenVisible && !isPreview && (
        <ul className="list-none p-0 pl-6 sm:pl-8">
          {item.children.map((child, i) => (
            <ToDoItem 
              key={child.id} 
              index={i} 
              item={child}
              parentId={item.id} 
              moveItem={moveItem} 
              onDropItem={onDropItem}
              onToggleItemComplete={onToggleItemComplete}
              onOpenContextMenu={onOpenContextMenu}
              onGenerateSubtasks={onGenerateSubtasks}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
              onUpdatePriority={onUpdatePriority}
              isGenerating={isGenerating}
              generatingItemId={generatingItemId}
            />
          ))}
        </ul>
      )}
      
      {isGenerating && generatingItemId === item.id && (
        <ul className="list-none p-0 pl-6 sm:pl-8" aria-label="하위 항목 생성 중">
          {[...Array(3)].map((_, i) => (
            <SkeletonToDoItem key={`skeleton-${i}`} />
          ))}
        </ul>
      )}
    </>
  );
};

export default ToDoItem;
