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

  /* [수정] Indigo 테마 적용 */
  const priorityConfig = {
    none: { border: 'border-slate-300', bg: 'bg-transparent', completed: 'bg-slate-400 border-slate-400' },
    low: { border: 'border-indigo-500', bg: 'bg-indigo-50', completed: 'bg-indigo-400 border-indigo-400' },
    medium: { border: 'border-orange-500', bg: 'bg-orange-50', completed: 'bg-orange-400 border-orange-400' },
    high: { border: 'border-red-600', bg: 'bg-red-50', completed: 'bg-red-400 border-red-400' }
  };
  const currentPriorityConfig = priorityConfig[item.priority || 'none'];

  return (
    <>
      <li
        ref={ref}
        style={{ 
          opacity: isDeleting ? 0 : (isDragging ? 0 : 1),
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        }}
        className={`
          flex items-center justify-between py-2 sm:py-1 border-b border-slate-100 
          group bg-white touch-manipulation item-fade-in
          ${isDeleting ? 'item-slide-out' : ''}
        `}
      >
        <div className="flex items-center flex-grow min-w-0">
          {/* 드래그 핸들 */}
          <div ref={drag} className="p-1 sm:invisible sm:group-hover:visible flex-shrink-0 text-slate-400 cursor-grab hover:text-slate-600">
            <RiDraggable className="text-lg" />
          </div>

          <div className="w-8 sm:w-8 text-center flex-shrink-0">
            {hasChildren && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChildrenVisible(!isChildrenVisible);
                }}
                className="text-slate-500 hover:text-slate-800 active:text-slate-900 p-1.5 sm:p-1 rounded-full min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              >
                {isChildrenVisible ? <RiArrowDownSLine className="text-lg" /> : <RiArrowRightSLine className="text-lg" />}
              </button>
            )}
          </div>

          {/* 우선순위 체크박스 */}
          <button 
            className="relative flex items-center justify-center p-1 cursor-pointer group/checkbox focus:outline-none"
            onClick={handleToggleComplete}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggleComplete(e);
              }
            }}
            aria-label={item.is_completed ? "할 일 완료 취소" : "할 일 완료"}
            role="checkbox"
            aria-checked={item.is_completed}
          >
            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200
              ${item.is_completed 
                ? currentPriorityConfig.completed 
                : `${currentPriorityConfig.border} ${currentPriorityConfig.bg} hover:bg-opacity-80`
              }
              group-focus/checkbox:ring-2 group-focus/checkbox:ring-offset-2 group-focus/checkbox:ring-indigo-500
            `}>
              <RiCheckLine 
                className={`
                  w-3.5 h-3.5 text-white transition-opacity duration-200
                  ${item.is_completed ? 'opacity-100' : 'opacity-0 group-hover/checkbox:opacity-100'}
                  ${!item.is_completed && currentPriorityConfig.border.includes('red') ? 'text-red-600' : ''}
                  ${!item.is_completed && currentPriorityConfig.border.includes('orange') ? 'text-orange-500' : ''}
                  ${!item.is_completed && currentPriorityConfig.border.includes('indigo') ? 'text-indigo-500' : ''}
                  ${!item.is_completed && currentPriorityConfig.border.includes('slate') ? 'text-slate-400' : ''}
                `} 
              />
            </div>
          </button>

          <span className={`flex-grow p-1 pr-2 ml-2 break-words ${item.is_completed ? 'text-slate-400 line-through' : 'text-slate-800'} text-sm sm:text-base`}>
            {item.description}
          </span>
          
          {/* 마감일 배지 */}
          {item.due_date && (() => {
            const dueDate = new Date(item.due_date);
            const now = new Date();
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
            
            const isDateOnly = dueDate.getHours() === 0 && dueDate.getMinutes() === 0 && dueDate.getSeconds() === 0;
            
            const dateFormat = isDateOnly
              ? { month: 'short', day: 'numeric' }
              : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            
            const colorClass = dueDate < now && !item.is_completed
              ? 'bg-red-50 text-red-700'
              : dueDate < tomorrow && !item.is_completed
              ? 'bg-orange-50 text-orange-700'
              : 'bg-indigo-50 text-indigo-700';
            
            return (
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1 ${colorClass}`}>
                <RiCalendarLine /> {dueDate.toLocaleDateString('ko-KR', dateFormat)}
              </span>
            );
          })()}
        </div>

        {/* 케밥 메뉴 */}
        <div className="flex-shrink-0 ml-2 sm:invisible sm:group-hover:visible">
          <button 
            onClick={handleMenuClick}
            disabled={isPreview}
            className="p-2 sm:p-1 rounded-full hover:bg-slate-100 active:bg-slate-200 disabled:cursor-default min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation text-slate-500"
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
        <ul className="list-none p-0 pl-6 sm:pl-8">
          {[...Array(3)].map((_, i) => (
            <SkeletonToDoItem key={`skeleton-${i}`} />
          ))}
        </ul>
      )}
    </>
  );
};

export default ToDoItem;
