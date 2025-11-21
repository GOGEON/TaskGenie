import React, { useState, useRef, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { IoIosArrowDown, IoIosArrowForward } from 'react-icons/io';
import SkeletonToDoItem from './SkeletonToDoItem';

const ItemType = 'TODO_ITEM';

/* [수정] 드래그 핸들 아이콘 - 6개 점 형태 */
const DragHandleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-400 cursor-grab">
    <circle cx="9" cy="12" r="1"></circle>
    <circle cx="9" cy="5" r="1"></circle>
    <circle cx="9" cy="19" r="1"></circle>
    <circle cx="15" cy="12" r="1"></circle>
    <circle cx="15" cy="5" r="1"></circle>
    <circle cx="15" cy="19" r="1"></circle>
  </svg>
);

/* [추가] 케밥 메뉴 아이콘 - 3개 세로 점 */
const KebabMenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-500">
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="12" cy="5" r="1"></circle>
    <circle cx="12" cy="19" r="1"></circle>
  </svg>
);

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
  onUpdatePriority, /* [추가] 우선순위 업데이트 핸들러 */
  isPreview = false,
  parentId = null,
  isGenerating = false,
  generatingItemId = null,
}) => {
  const ref = useRef(null);
  const [isChildrenVisible, setIsChildrenVisible] = useState(true);
  const wasChildrenVisibleBeforeDrag = useRef(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      // 드래그 시작 시 현재 상태를 저장하고 하위 항목을 접습니다
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
    // 버튼 중심에서 메뉴가 열리도록 계산
    const x = rect.left + rect.width / 2;
    const y = rect.bottom;
    onOpenContextMenu(x, y, item.id, item.priority || 'none', item.due_date);
  };

  /* [개선] 완료 토글 처리 */
  const handleToggleComplete = (e) => {
    e.stopPropagation();
    onToggleItemComplete(item.id, !item.is_completed);
  };

  /* [개선] 삭제 처리 - 슬라이드 아웃 애니메이션 추가 */
  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDeleteItem(item.id);
    }, 400); // 애니메이션 시간과 맞춤
  };

  /* [추가] 우선순위 변경 핸들러 */
  const handlePriorityChange = (newPriority) => {
    if (onUpdatePriority) {
      onUpdatePriority(item.id, newPriority);
    }
  };

  /* [추가] 우선순위별 색상 및 아이콘 설정 */
  /* none: 회색 테두리, low: 진한 회색, medium: 주황색, high: 빨간색 */
  const priorityConfig = {
    none: { color: 'border-l-gray-200', icon: '○' },
    low: { color: 'border-l-gray-400', icon: '⚪' },
    medium: { color: 'border-l-orange-500', icon: '🟡' },
    high: { color: 'border-l-red-500', icon: '🔴' }
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
          flex items-center justify-between py-2 sm:py-1 border-t border-b border-l-4 border-gray-100 
          ${currentPriorityConfig.color}
          group bg-white touch-manipulation item-fade-in
          ${isDeleting ? 'item-slide-out' : ''}
        `}
      >
        <div className="flex items-center flex-grow min-w-0">
          {/* [추가] 드래그 핸들 - 모바일에서 항상 표시, 데스크톱에서 호버 시 표시 */}
          <div ref={drag} className="p-1 sm:invisible sm:group-hover:visible flex-shrink-0">
            <DragHandleIcon />
          </div>

          <div className="w-8 sm:w-8 text-center flex-shrink-0">
            {hasChildren && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChildrenVisible(!isChildrenVisible);
                }}
                className="text-gray-500 hover:text-gray-800 active:text-gray-900 p-1.5 sm:p-1 rounded-full min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              >
                {isChildrenVisible ? <IoIosArrowDown className="text-lg sm:text-base" /> : <IoIosArrowForward className="text-lg sm:text-base" />}
              </button>
            )}
          </div>

          {/* [수정] 커스텀 원형 체크박스로 변경 (이전: 기본 사각형 체크박스) */}
          <input
            type="checkbox"
            checked={item.is_completed}
            onChange={handleToggleComplete}
            className="custom-checkbox mx-2 flex-shrink-0 min-w-[20px] min-h-[20px] sm:min-w-[18px] sm:min-h-[18px]"
          />

          {/* [삭제] 항목 텍스트 앞 우선순위 아이콘 제거 (이전: 🔴🟡⚪ 이모지 표시) */}
          <span className={`flex-grow p-1 pr-2 break-words ${item.is_completed ? 'text-gray-400 line-through' : 'text-gray-800'} text-sm sm:text-base`}>
            {item.description}
          </span>
          
          {/* [추가] 마감일 배지 표시 - 색상 코드로 긴급도 표시 */}
          {/* 빨강: 마감일 지남, 주황: 24시간 이내, 파랑: 여유 있음 */}
          {/* [수정] 날짜 전용과 날짜+시간 형식을 모두 지원 */}
          {item.due_date && (() => {
            const dueDate = new Date(item.due_date);
            const now = new Date();
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
            
            // 날짜만 있는지 (시간이 00:00:00인지) 확인
            const isDateOnly = dueDate.getHours() === 0 && dueDate.getMinutes() === 0 && dueDate.getSeconds() === 0;
            
            // 날짜 형식 결정: 날짜 전용이면 시간 제외, 아니면 시간 포함
            const dateFormat = isDateOnly
              ? { month: 'short', day: 'numeric' }
              : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            
            // 색상 결정
            const colorClass = dueDate < now && !item.is_completed
              ? 'bg-red-100 text-red-700'
              : dueDate < tomorrow && !item.is_completed
              ? 'bg-orange-100 text-orange-700'
              : 'bg-blue-100 text-blue-700';
            
            return (
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1 ${colorClass}`}>
                📅 {dueDate.toLocaleDateString('ko-KR', dateFormat)}
              </span>
            );
          })()}
        </div>

        {/* [수정] 케밥 메뉴로 액션 통합 (이전: 개별 수정/삭제 버튼) */}
        {/* 우선순위 선택, 마감일 설정, 수정, 삭제, AI 하위 항목 생성 모두 포함 */}
        <div className="flex-shrink-0 ml-2 sm:invisible sm:group-hover:visible">
          <button 
            onClick={handleMenuClick}
            disabled={isPreview}
            className="p-2 sm:p-1 rounded-full hover:bg-gray-200 active:bg-gray-300 disabled:cursor-default min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center touch-manipulation"
          >
            <KebabMenuIcon />
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
      
      {/* [수정] 스켈레톤 UI가 실제 UI와 일치하도록 level prop 제거 */}
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
