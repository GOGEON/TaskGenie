import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import ToDoListDisplay from '../components/ToDoListDisplay';
import ContextMenu from '../components/ContextMenu';
import EditModal from '../components/EditModal';
import {
  generateSubtasks,
  updateToDoItem,
  deleteToDoItem,
  createTodoItemFromNaturalLanguage,
} from '../services/todoApiService';

// --- Recursive Helper Functions for State Management ---

const findItemRecursive = (items, itemId) => {
  for (const item of items) {
    if (item.id === itemId) return item;
    if (item.children?.length) {
      const found = findItemRecursive(item.children, itemId);
      if (found) return found;
    }
  }
  return null;
};

const updateItemInArray = (items, updatedItem) => {
  return items.map(item => {
    if (item.id === updatedItem.id) return updatedItem;
    if (item.children?.length) {
      return { ...item, children: updateItemInArray(item.children, updatedItem) };
    }
    return item;
  });
};

const editItemRecursive = (items, itemId, newDescription) => {
  return items.map(item => {
    if (item.id === itemId) return { ...item, description: newDescription };
    if (item.children?.length) {
      return { ...item, children: editItemRecursive(item.children, itemId, newDescription) };
    }
    return item;
  });
};

const deleteItemRecursive = (items, itemId) => {
  return items
    .filter(item => item.id !== itemId)
    .map(item => {
      if (item.children?.length) {
        return { ...item, children: deleteItemRecursive(item.children, itemId) };
      }
      return item;
    });
};

// --- New Helpers for Completion Sync ---

const setChildrenCompletionRecursive = (items, isCompleted) => {
  return items.map(item => {
    let newChildren = item.children;
    if (item.children?.length) {
      newChildren = setChildrenCompletionRecursive(item.children, isCompleted);
    }
    return { ...item, is_completed: isCompleted, children: newChildren };
  });
};

const toggleItemAndChildren = (items, itemId, isCompleted) => {
  return items.map(item => {
    if (item.id === itemId) {
      let newChildren = item.children;
      if (item.children?.length) {
        newChildren = setChildrenCompletionRecursive(item.children, isCompleted);
      }
      return { ...item, is_completed: isCompleted, children: newChildren };
    }
    if (item.children?.length) {
      return { ...item, children: toggleItemAndChildren(item.children, itemId, isCompleted) };
    }
    return item;
  });
};

const synchronizeParentStates = (items) => {
  let changed = false;
  const newItems = items.map(item => {
    if (!item.children?.length) {
      return item; // Leaf node
    }
    
    const newChildren = synchronizeParentStates(item.children);
    const allChildrenComplete = newChildren.every(child => child.is_completed);
    
    if (item.is_completed !== allChildrenComplete) {
      changed = true;
      return { ...item, is_completed: allChildrenComplete, children: newChildren };
    }
    return { ...item, children: newChildren };
  });

  if (changed) {
    return synchronizeParentStates(newItems);
  }
  return newItems;
};

// --- Client-side AI Subtask Generation Placeholder (from ex.html) ---
const generateClientSideSubtasks = (mainTask) => {
  const taskPatterns = {
    '프로젝트': ['요구사항 분석하기', '기획서 작성하기', '디자인 시안 제작하기', '개발 일정 수립하기', '테스트 계획 세우기'],
    '운동': ['운동복 준비하기', '워밍업 10분 하기', '메인 운동 30분 하기', '쿨다운 5분 하기', '운동 기록 작성하기'],
    '요리': ['재료 목록 작성하기', '장보기', '재료 손질하기', '요리하기', '설거지하기'],
    '공부': ['학습 계획 세우기', '교재 준비하기', '핵심 개념 정리하기', '문제 풀이하기', '복습하기'],
    '여행': ['목적지 조사하기', '숙소 예약하기', '교통편 예약하기', '여행 일정 계획하기', '짐 싸기']
  };

  for (let pattern in taskPatterns) {
    if (mainTask.includes(pattern)) {
      return taskPatterns[pattern];
    }
  }

  return [
    '세부 계획 수립하기',
    '필요한 자료 준비하기',
    '실행하기',
    '결과 확인하기',
    '완료 정리하기'
  ];
};

function ProjectView({ project, setProjects }) {
  const [contextMenu, setContextMenu] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const taskInputRef = useRef(null);

  // Function to update a project in the main App's projects state
  const updateProjectInApp = (updatedProject) => {
    setProjects(prevProjects =>
      prevProjects.map(p => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  // --- API Handlers ---

  const handleGenerateSubtasks = async (parentItemId) => {
    toast.promise(generateSubtasks(parentItemId), {
      loading: '세부 항목을 생성 중입니다...',
      success: (updatedParentItem) => {
        const updatedProject = { 
          ...project, 
          items: updateItemInArray(project.items, updatedParentItem) 
        };
        updateProjectInApp(updatedProject);
        return '세부 항목이 성공적으로 생성되었습니다!';
      },
      error: '세부 항목 생성에 실패했습니다.',
    });
  };

  const handleToggleItemComplete = async (listId, itemId, isCompleted) => {
    // Optimistic UI update first
    const itemsWithToggledChildren = toggleItemAndChildren(project.items, itemId, isCompleted);
    const syncedItems = synchronizeParentStates(itemsWithToggledChildren);
    const updatedProject = { ...project, items: syncedItems };
    updateProjectInApp(updatedProject);

    // Call API to update just the clicked item
    try {
      await updateToDoItem(itemId, { is_completed: isCompleted });
    } catch (err) {
      console.error('할 일 항목 상태 업데이트 중 오류 발생:', err);
      toast.error("상태 업데이트에 실패했습니다. 페이지를 새로고침 해주세요.");
      // Consider reverting state here if API fails
    }
  };

  const handleEditItem = async (listId, itemId, newDescription) => {
    try {
      await updateToDoItem(itemId, { description: newDescription });
      const updatedProject = { 
        ...project, 
        items: editItemRecursive(project.items, itemId, newDescription) 
      };
      updateProjectInApp(updatedProject);
      setEditingItem(null); // Close modal on save
      toast.success('항목이 수정되었습니다.');
    } catch (err) {
      toast.error("항목 수정에 실패했습니다.");
    }
  };

  const handleDeleteItem = async (listId, itemId) => {
    if (window.confirm('이 항목과 모든 하위 항목을 정말로 삭제하시겠습니까?')) {
      try {
        await deleteToDoItem(itemId);
        const updatedProject = { 
          ...project, 
          items: deleteItemRecursive(project.items, itemId) 
        };
        updateProjectInApp(updatedProject);
        toast.success("항목이 삭제되었습니다.");
      } catch (err) {
        toast.error("항목 삭제에 실패했습니다.");
      }
    }
  };

  // --- New Task Input Handler ---
  const handleAddTask = (e) => {
    if (e.key === 'Enter' && taskInputRef.current.value.trim()) {
      const naturalLanguageText = taskInputRef.current.value.trim();
      taskInputRef.current.value = ''; // Clear input immediately

      toast.promise(
        createTodoItemFromNaturalLanguage(naturalLanguageText, project.id),
        {
          loading: 'AI가 할 일을 분석하고 있습니다...',
          success: (newItem) => {
            const updatedProject = {
              ...project,
              items: [...project.items, newItem],
            };
            updateProjectInApp(updatedProject);
            return 'AI가 할 일을 성공적으로 추가했습니다!';
          },
          error: (err) => {
            // Restore input if there was an error
            taskInputRef.current.value = naturalLanguageText;
            return err.response?.data?.detail || '할 일 추가에 실패했습니다.';
          },
        }
      );
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, itemId) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragOver = (e, itemId) => {
    e.preventDefault();
    if (dragOverItem !== itemId && draggedItem !== itemId) {
      setDragOverItem(itemId);
    }
  };

  const handleDragLeave = () => {
    // dragLeave는 빈번하게 발생하므로 제거하지 않음
  };

  const handleDragEnd = () => {
    // dragEnd에서 최종 순서를 서버에 저장
    if (draggedItem && dragOverItem && draggedItem !== dragOverItem) {
      const newItems = Array.from(project.items);
      const draggedIndex = newItems.findIndex(item => item.id === draggedItem);
      const targetIndex = newItems.findIndex(item => item.id === dragOverItem);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, removed);
        const reorderedItems = newItems.map((item, index) => ({ 
          ...item, 
          order: index 
        }));
        updateProjectInApp({ ...project, items: reorderedItems });
        handleReorderItems(reorderedItems);
      }
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDrop = (targetItemId) => {
    // Drop은 이벤트만 처리하고, 실제 저장은 dragEnd에서 수행
  };

  const handleReorderItems = async (reorderedItems) => {
    try {
      const updatePromises = reorderedItems.map(item => 
        updateToDoItem(item.id, { order: item.order })
      );
      await Promise.all(updatePromises);
      const updatedProject = { ...project, items: reorderedItems };
      updateProjectInApp(updatedProject);
    } catch (err) {
      console.error('항목 순서 변경 중 오류 발생:', err);
      toast.error('항목 순서 변경에 실패했습니다.');
    }
  };

  // --- Context Menu Handlers ---
  const handleOpenContextMenu = (x, y, itemId) => {
    setContextMenu({ x, y, itemId, listId: project.id });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const contextMenuOptions = contextMenu ? [
    {
      label: "수정",
      action: () => {
        const item = findItemRecursive(project.items, contextMenu.itemId);
        if (item) setEditingItem(item);
      }
    },
    {
      label: "세부 항목 생성",
      action: () => handleGenerateSubtasks(contextMenu.itemId)
    },
    {
      label: "삭제",
      action: () => handleDeleteItem(contextMenu.listId, contextMenu.itemId)
    }
  ] : [];

  return (
    <div className="flex-1 flex flex-col">
      {/* 할 일 입력 영역 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
          </div>
          <input 
            type="text" 
            placeholder="새 작업을 추가하세요... (예: 프로젝트 기획)" 
            className="flex-1 text-sm text-gray-600 border-none outline-none bg-transparent"
            onKeyPress={handleAddTask}
            ref={taskInputRef}
          />
        </div>
      </div>

      {/* 할 일 목록 */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4">
          {project.items && project.items.length > 0 ? (
            <ToDoListDisplay
              todoList={project}
              onToggleItemComplete={(itemId, isCompleted) => handleToggleItemComplete(project.id, itemId, isCompleted)}
              onEditItem={(itemId, newDescription) => handleEditItem(project.id, itemId, newDescription)}
              onDeleteItem={(itemId) => handleDeleteItem(project.id, itemId)}
              onReorderItems={handleReorderItems}
              onGenerateSubtasks={handleGenerateSubtasks}
              onOpenContextMenu={handleOpenContextMenu}
              onDragStart={handleDragStart}
              onDragOver={(e, itemId) => handleDragOver(e, itemId)}
              onDragLeave={handleDragLeave}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              draggedItemId={draggedItem}
              dragOverItemId={dragOverItem}
              isDragging={(itemId) => itemId === draggedItem}
            />
          ) : (
            <p className="text-center text-gray-500">이 프로젝트에는 아직 할 일이 없습니다. 새 작업을 추가해보세요!</p>
          )}
        </div>
      </div>

      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          options={contextMenuOptions} 
          onClose={handleCloseContextMenu} 
        />
      )}

      {editingItem && (
        <EditModal 
          item={editingItem}
          onSave={(itemId, newDescription) => {
            handleEditItem(project.id, itemId, newDescription);
          }}
          onCancel={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

export default ProjectView;
