/**
 * 홈 페이지 컴포넌트
 * 
 * 프로젝트의 할 일 목록을 표시하고 관리하는 메인 페이지.
 * 
 * 주요 기능:
 * - 할 일 목록 트리 구조 표시
 * - 드래그 앤 드롭으로 순서 변경
 * - 체크박스로 완료 상태 토글
 * - 컨텍스트 메뉴로 수정/삭제/서브태스크 생성
 * - AI 기반 서브태스크 자동 생성
 * - 자연어 입력으로 작업 추가
 * 
 * @module HomePage
 */
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import update from 'immutability-helper';
import ToDoListDisplay from '../components/ToDoListDisplay';
import ContextMenu from '../components/ContextMenu';
import EditModal from '../components/EditModal';
import SkeletonToDoItem from '../components/SkeletonToDoItem';
import {
  generateSubtasks,
  updateToDoItem,
  deleteToDoItem,
  deleteToDoList,
  updateToDoList,
  createTodoItemFromNaturalLanguage,
} from '../services/todoApiService';


// ==================== 헬퍼 함수 ====================

/**
 * 특정 부모의 자식 항목들 순서 재정렬.
 * 드래그 앤 드롭 시 사용.
 * 
 * @param {Array} items - 전체 항목 배열
 * @param {string} parentId - 부모 항목 ID
 * @param {number} dragIndex - 드래그 시작 인덱스
 * @param {number} hoverIndex - 드랍 위치 인덱스
 * @returns {Array} 재정렬된 항목 배열
 */
const reorderChildren = (items, parentId, dragIndex, hoverIndex) => {
  return items.map(item => {
    if (item.id === parentId) {
      const draggedChild = item.children[dragIndex];
      const reorderedChildren = update(item.children, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, draggedChild],
        ],
      });
      return { ...item, children: reorderedChildren };
    }
    if (item.children?.length) {
      return { ...item, children: reorderChildren(item.children, parentId, dragIndex, hoverIndex) };
    }
    return item;
  });
};


/**
 * 트리 구조에서 특정 ID의 항목 검색.
 * 
 * @param {Array} items - 검색할 항목 배열
 * @param {string} itemId - 찾을 항목 ID
 * @returns {Object|null} 찾은 항목 또는 null
 */
const findItemRecursive = (items, itemId) => {
  for (let item of items) {
    if (item.id === itemId) return item;
    if (item.children?.length) {
      const found = findItemRecursive(item.children, itemId);
      if (found) return found;
    }
  }
  return null;
};


/**
 * 트리 구조에서 특정 항목 업데이트.
 * 
 * @param {Array} items - 전체 항목 배열
 * @param {Object} updatedItem - 업데이트할 항목 (id 포함)
 * @returns {Array} 업데이트된 항목 배열
 */
const updateItemInArray = (items, updatedItem) => {
  return items.map(item => {
    if (item.id === updatedItem.id) return updatedItem;
    if (item.children?.length) {
      return { ...item, children: updateItemInArray(item.children, updatedItem) };
    }
    return item;
  });
};


/**
 * 트리 구조에서 특정 항목의 설명 수정.
 * 
 * @param {Array} items - 전체 항목 배열
 * @param {string} itemId - 수정할 항목 ID
 * @param {string} newDescription - 새 설명
 * @returns {Array} 수정된 항목 배열
 */
const editItemRecursive = (items, itemId, newDescription) => {
  return items.map(item => {
    if (item.id === itemId) return { ...item, description: newDescription };
    if (item.children?.length) {
      return { ...item, children: editItemRecursive(item.children, itemId, newDescription) };
    }
    return item;
  });
};


/**
 * 트리 구조에서 특정 항목 삭제 (자식 포함).
 * 
 * @param {Array} items - 전체 항목 배열
 * @param {string} itemId - 삭제할 항목 ID
 * @returns {Array} 삭제된 항목이 제외된 배열
 */
const deleteItemRecursive = (items, itemId) => {
  console.log('Deleting item:', itemId);
  return items
    .filter(item => String(item.id) !== String(itemId))
    .map(item => {
      if (item.children?.length) {
        return { ...item, children: deleteItemRecursive(item.children, itemId) };
      }
      return item;
    });
};


/**
 * 모든 자식 항목의 완료 상태 일괄 설정.
 * 
 * @param {Array} items - 처리할 항목 배열
 * @param {boolean} isCompleted - 설정할 완료 상태
 * @returns {Array} 완료 상태가 변경된 항목 배열
 */
const setChildrenCompletionRecursive = (items, isCompleted) => {
  return items.map(item => {
    let newChildren = item.children;
    if (item.children?.length) {
      newChildren = setChildrenCompletionRecursive(item.children, isCompleted);
    }
    return { ...item, is_completed: isCompleted, children: newChildren };
  });
};


/**
 * 특정 항목과 모든 자식의 완료 상태 토글.
 * 
 * @param {Array} items - 전체 항목 배열
 * @param {string} itemId - 토글할 항목 ID
 * @param {boolean} isCompleted - 새 완료 상태
 * @returns {Array} 토글된 항목 배열
 */
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


/**
 * 부모 항목의 완료 상태를 자식 상태에 맞게 동기화.
 * 모든 자식이 완료되면 부모도 완료로 설정.
 * 
 * @param {Array} items - 동기화할 항목 배열
 * @returns {Array} 동기화된 항목 배열
 */
const synchronizeParentStates = (items) => {
  let changed = false;
  const newItems = items.map(item => {
    if (!item.children?.length) {
      return item;
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


/**
 * 홈 페이지 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {Object} props.project - 현재 활성 프로젝트
 * @param {Function} props.setProjects - 전역 프로젝트 상태 설정 함수
 * @param {Function} props.triggerRefetch - 데이터 재조회 트리거 함수
 * @param {Function} props.onOpenQuickAdd - 빠른 추가 모달 열기 함수
 * @returns {JSX.Element} 홈 페이지 요소
 */
function HomePage({ project, setProjects, triggerRefetch, onOpenQuickAdd }) {
  // ==================== 컴포넌트 상태 ====================
  const [currentProject, setCurrentProject] = useState(project);
  const [contextMenu, setContextMenu] = useState(null);       // 컨텍스트 메뉴 상태
  const [editingItem, setEditingItem] = useState(null);       // 수정 중인 항목 ID
  const [isGenerating, setIsGenerating] = useState(false);    // AI 생성 중 여부
  const [generatingItemId, setGeneratingItemId] = useState(null);  // AI 생성 중인 항목 ID
  const taskInputRef = React.useRef(null);
  
  // 낙관적 업데이트를 위한 참조
  const projectRef = React.useRef(currentProject);
  const toggleQueueRef = React.useRef([]);          // 체크박스 토글 요청 큐
  const isProcessingQueueRef = React.useRef(false); // 큐 처리 중 여부

  useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  /* [추가] currentProject가 변경될 때마다 projectRef 동기화 */
  useEffect(() => {
    projectRef.current = currentProject;
  }, [currentProject]);

  const updateGlobalProjectState = (updatedProject) => {
    setProjects(prevProjects =>
      prevProjects.map(p => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const handleAddTask = (e) => {
    if (e.key === 'Enter' && taskInputRef.current.value.trim()) {
      const naturalLanguageText = taskInputRef.current.value.trim();
      taskInputRef.current.value = ''; // Clear input immediately

      toast.promise(
        createTodoItemFromNaturalLanguage(naturalLanguageText, currentProject.id),
        {
          loading: 'AI가 할 일을 분석하고 있습니다...',
          success: (newItem) => {
            const updatedProject = {
              ...currentProject,
              items: [...currentProject.items, newItem],
            };
            setCurrentProject(updatedProject);
            updateGlobalProjectState(updatedProject);
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


  const moveItem = useCallback((dragIndex, hoverIndex, parentId = null) => {
    setCurrentProject((prevProject) => {
      let newItems;
      if (parentId === null) {
        const draggedItem = prevProject.items[dragIndex];
        newItems = update(prevProject.items, {
          $splice: [[dragIndex, 1], [hoverIndex, 0, draggedItem]],
        });
      } else {
        newItems = reorderChildren(prevProject.items, parentId, dragIndex, hoverIndex);
      }
      return { ...prevProject, items: newItems };
    });
  }, []);


  const handleGenerateSubtasks = async (parentItemId) => {
    setIsGenerating(true);
    setGeneratingItemId(parentItemId);
    try {
      const updatedParentItem = await toast.promise(generateSubtasks(parentItemId), {
        loading: '세부 항목을 생성 중입니다...',
        success: '세부 항목이 성공적으로 생성되었습니다!',
        error: '세부 항목 생성에 실패했습니다.',
      });
      const updatedItems = updateItemInArray(currentProject.items, updatedParentItem);
      const updatedProject = { ...currentProject, items: updatedItems };
      setCurrentProject(updatedProject);
      updateGlobalProjectState(updatedProject);
    } catch (error) { /* toast handles error */ }
    finally {
      setIsGenerating(false);
      setGeneratingItemId(null);
    }
  };

  /* [수정] 체크박스 토글 실제 실행 함수 - 변경된 모든 항목(부모 포함) 저장 */
  const executeToggle = async (itemId, isCompleted, originalItems) => {
    try {
      // <!-- [수정] 부모 항목 완료 상태도 DB에 저장되도록 수정 - 토글 전후 상태 비교하여 변경된 모든 항목 저장 -->
      // 토글 전후 상태를 비교하여 변경된 모든 항목 수집 (부모 포함)
      const collectChangedItems = (origItems, updItems) => {
        const result = [];
        const compare = (origList, updList) => {
          for (const updItem of updList) {
            const origItem = origList?.find(o => o.id === updItem.id);
            // 원래 없었거나 is_completed 상태가 변경된 경우
            if (!origItem || origItem.is_completed !== updItem.is_completed) {
              result.push({ id: updItem.id, is_completed: updItem.is_completed });
            }
            // 자식들도 재귀적으로 비교
            if (updItem.children?.length) {
              compare(origItem?.children || [], updItem.children);
            }
          }
        };
        compare(origItems, updItems);
        return result;
      };
      
      const changedItems = collectChangedItems(originalItems, projectRef.current.items);
      
      // 변경된 모든 항목 업데이트 (부모 포함)
      const promises = changedItems.map(item =>
        updateToDoItem(item.id, { is_completed: item.is_completed })
      );
      await Promise.all(promises);
      
      // 성공 시 글로벌 상태도 업데이트
      updateGlobalProjectState(projectRef.current);
    } catch (err) {
      console.error('할 일 항목 상태 업데이트 중 오류 발생:', err);
      toast.error("상태 업데이트에 실패했습니다. 페이지를 새로고침 해주세요.");
    }
  };

  /* [수정] 큐 처리 함수 - 순차적으로 모든 토글 요청 실행 + 완료 후 최종 동기화 */
  const processToggleQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || toggleQueueRef.current.length === 0) {
      return;
    }
    
    isProcessingQueueRef.current = true;
    
    while (toggleQueueRef.current.length > 0) {
      // <!-- [수정] 토글 전 상태를 큐에 저장하여 executeToggle에서 부모 상태 변경도 감지 -->
      const { itemId, isCompleted, originalItems } = toggleQueueRef.current.shift();
      await executeToggle(itemId, isCompleted, originalItems);
    }
    
    // [추가] 모든 토글 완료 후 최종 order 동기화
    try {
      const currentState = projectRef.current;
      
      // 모든 항목의 ID와 order를 수집 (재귀적으로)
      const collectAllItems = (items) => {
        const result = [];
        items.forEach(item => {
          result.push({ id: item.id, order: item.order });
          if (item.children?.length) {
            result.push(...collectAllItems(item.children));
          }
        });
        return result;
      };
      
      const allItemsToUpdate = collectAllItems(currentState.items);
      
      // 순서 일괄 저장
      const orderPromises = allItemsToUpdate.map(item =>
        updateToDoItem(item.id, { order: item.order })
      );
      await Promise.all(orderPromises);
      
      // 최종 글로벌 상태 업데이트
      updateGlobalProjectState(currentState);
    } catch (err) {
      console.error('순서 업데이트 중 오류 발생:', err);
    }
    
    isProcessingQueueRef.current = false;
  }, []);

  const handleToggleItemComplete = (itemId, isCompleted) => {
    /* [수정] 큐에 요청 추가하고 즉시 낙관적 UI 업데이트 */
    // <!-- [수정] 토글 전 상태를 저장하여 나중에 변경된 항목(부모 포함) 감지 -->
    const originalItems = JSON.parse(JSON.stringify(projectRef.current.items));
    toggleQueueRef.current.push({ itemId, isCompleted, originalItems });
    
    // 즉시 낙관적 UI 업데이트
    const baseProject = projectRef.current;
    const itemsWithToggledChildren = toggleItemAndChildren(baseProject.items, itemId, isCompleted);
    const syncedItems = synchronizeParentStates(itemsWithToggledChildren);
    
    // 재귀적으로 모든 레벨에서 완료된 항목을 하단으로 이동 (정렬)
    const sortItemsRecursively = (items) => {
      return items
        .sort((a, b) => {
          if (a.is_completed !== b.is_completed) {
            return a.is_completed - b.is_completed;
          }
          return a.order - b.order;
        })
        .map(item => {
          if (item.children?.length) {
            return { ...item, children: sortItemsRecursively(item.children) };
          }
          return item;
        });
    };
    
    const sortedItems = sortItemsRecursively(syncedItems);
    
    // 재귀적으로 모든 항목의 order를 재할당
    const reassignOrderRecursively = (items) => {
      return items.map((item, index) => {
        const updatedItem = { ...item, order: index };
        if (item.children?.length) {
          updatedItem.children = reassignOrderRecursively(item.children);
        }
        return updatedItem;
      });
    };
    
    const reorderedItems = reassignOrderRecursively(sortedItems);
    const updatedProject = { ...baseProject, items: reorderedItems };
    projectRef.current = updatedProject;
    setCurrentProject(updatedProject);
    
    // 큐 처리 시작
    processToggleQueue();
  };

  const handleEditItem = async (itemId, newDescription) => {
    const previousProject = currentProject;
    const updatedItems = editItemRecursive(currentProject.items, itemId, newDescription);
    const updatedProject = { ...currentProject, items: updatedItems };
    setCurrentProject(updatedProject);
    updateGlobalProjectState(updatedProject);
    setEditingItem(null);

    try {
      await updateToDoItem(itemId, { description: newDescription });
      toast.success('항목이 수정되었습니다.');
    } catch (err) {
      toast.error("항목 수정에 실패했습니다.");
      setCurrentProject(previousProject);
      updateGlobalProjectState(previousProject);
    }
  };

  const handleUpdatePriority = async (itemId, newPriority) => {
    const updatePriorityRecursive = (items, targetId, priority) => {
      return items.map(item => {
        if (item.id === targetId) {
          return { ...item, priority };
        }
        if (item.children?.length) {
          return { ...item, children: updatePriorityRecursive(item.children, targetId, priority) };
        }
        return item;
      });
    };

    const previousProject = currentProject;
    const updatedItems = updatePriorityRecursive(currentProject.items, itemId, newPriority);
    const updatedProject = { ...currentProject, items: updatedItems };
    setCurrentProject(updatedProject);
    updateGlobalProjectState(updatedProject);

    try {
      await updateToDoItem(itemId, { priority: newPriority });
      toast.success('우선순위가 변경되었습니다.');
    } catch (err) {
      toast.error("우선순위 변경에 실패했습니다.");
      setCurrentProject(previousProject);
      updateGlobalProjectState(previousProject);
    }
  };

  const handleUpdateDueDate = async (itemId, newDueDate) => {
    const updateDueDateRecursive = (items, targetId, dueDate) => {
      return items.map(item => {
        if (item.id === targetId) {
          return { ...item, due_date: dueDate };
        }
        if (item.children?.length) {
          return { ...item, children: updateDueDateRecursive(item.children, targetId, dueDate) };
        }
        return item;
      });
    };

    const previousProject = currentProject;
    const updatedItems = updateDueDateRecursive(currentProject.items, itemId, newDueDate);
    const updatedProject = { ...currentProject, items: updatedItems };
    setCurrentProject(updatedProject);
    updateGlobalProjectState(updatedProject);

    try {
      await updateToDoItem(itemId, { due_date: newDueDate });
      toast.success(newDueDate ? '마감일이 설정되었습니다.' : '마감일이 제거되었습니다.');
    } catch (err) {
      toast.error("마감일 변경에 실패했습니다.");
      setCurrentProject(previousProject);
      updateGlobalProjectState(previousProject);
    }
  };

  const handleUpdateKeyword = async (newKeyword) => {
    const previousProject = currentProject;
    const updatedProject = { ...currentProject, keyword: newKeyword };
    setCurrentProject(updatedProject);
    updateGlobalProjectState(updatedProject);

    try {
      await updateToDoList(currentProject.id, { keyword: newKeyword });
      toast.success('프로젝트 이름이 변경되었습니다.');
    } catch (err) {
      toast.error("프로젝트 이름 변경에 실패했습니다.");
      setCurrentProject(previousProject);
      updateGlobalProjectState(previousProject);
    }
  };

  const handleDeleteItem = async (itemId) => {
    console.log('handleDeleteItem called with:', itemId);
    if (window.confirm('이 항목과 모든 하위 항목을 정말로 삭제하시겠습니까?')) {
      const updatedItems = deleteItemRecursive(currentProject.items, itemId);
      const updatedProject = { ...currentProject, items: updatedItems };
      setCurrentProject(updatedProject);
      updateGlobalProjectState(updatedProject);

      try {
        console.log('Calling API deleteToDoItem:', itemId);
        await deleteToDoItem(itemId);
        toast.success("항목이 삭제되었습니다.");
      } catch (err) {
        console.error('Delete failed:', err);
        toast.error("항목 삭제에 실패했습니다.");
        setCurrentProject(project);
        updateGlobalProjectState(project);
      }
    }
  };

  const handleDeleteList = async (listId) => {
    if (window.confirm('이 목록을 정말로 삭제하시겠습니까?')) {
      try {
        await toast.promise(deleteToDoList(listId), {
          loading: '할 일 목록을 삭제하는 중입니다...',
          success: '할 일 목록이 성공적으로 삭제되었습니다!',
          error: '할 일 목록 삭제에 실패했습니다.',
        });
        // 삭제 성공 후 전체 프로젝트 목록 재조회
        if (triggerRefetch) {
          triggerRefetch();
        }
      } catch (error) {
        console.error('프로젝트 삭제 실패:', error);
      }
    }
  };

  const handleDropAndSave = async () => {
    // 모든 항목(중첩된 하위 항목 포함)의 order를 재귀적으로 업데이트
    const updateOrderRecursively = (items) => {
      return items.map((item, index) => {
        const updatedItem = { ...item, order: index };
        if (item.children?.length) {
          updatedItem.children = updateOrderRecursively(item.children);
        }
        return updatedItem;
      });
    };
    
    const reorderedItems = updateOrderRecursively(currentProject.items);
    
    // 모든 항목의 ID와 order를 수집 (재귀적으로)
    const collectAllItems = (items) => {
      const result = [];
      items.forEach(item => {
        result.push({ id: item.id, order: item.order });
        if (item.children?.length) {
          result.push(...collectAllItems(item.children));
        }
      });
      return result;
    };
    
    const allItemsToUpdate = collectAllItems(reorderedItems);

    try {
      const updatePromises = allItemsToUpdate.map(item =>
        updateToDoItem(item.id, { order: item.order })
      );
      await Promise.all(updatePromises);
      updateGlobalProjectState({ ...currentProject, items: reorderedItems });
      toast.success('순서가 저장되었습니다.');
    } catch (err) {
      console.error('항목 순서 변경 중 오류 발생:', err);
      toast.error('항목 순서 변경에 실패했습니다.');
      setCurrentProject(project);
    }
  };

  const handleOpenContextMenu = (x, y, itemId, currentPriority = 'none', dueDate = null) => {
    setContextMenu({ x, y, itemId, currentPriority, dueDate });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const contextMenuOptions = contextMenu ? [
    {
      label: '하위 작업 생성',
      onClick: () => {
        handleGenerateSubtasks(contextMenu.itemId);
        handleCloseContextMenu();
      }
    },
    {
      label: '수정',
      onClick: () => {
        setEditingItem(contextMenu.itemId);
        handleCloseContextMenu();
      }
    },
    {
      label: '삭제',
      onClick: () => {
        handleDeleteItem(contextMenu.itemId);
        handleCloseContextMenu();
      }
    }
  ] : [];

  if (!currentProject) {
    return <div className="p-8 text-center text-slate-500">프로젝트를 불러오는 중...</div>;
  }

  return (
    // <!-- [수정] 모바일 화면 답답함 해소 - 패딩 줄이고 여백 최적화 -->
    <div className="container p-2 sm:p-4 md:p-8 max-w-5xl mx-auto" style={{ textAlign: 'left' }}>
      {contextMenu && (() => {
        /* [수정] 컨텍스트 메뉴가 열려있을 때 실시간으로 최신 항목 데이터를 조회 */
        /* 이를 통해 우선순위나 마감일 변경 시 메뉴 내에서도 즉시 반영됨 */
        const targetItem = findItemRecursive(currentProject.items, contextMenu.itemId);
        
        /* 항목이 삭제되었거나 찾을 수 없는 경우 메뉴를 표시하지 않음 */
        if (!targetItem) return null;

        return (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            options={contextMenuOptions}
            onClose={handleCloseContextMenu}
            priorityConfig={{
              currentPriority: targetItem.priority || 'none', /* [수정] 실시간 우선순위 사용 */
              onPriorityChange: (newPriority) => handleUpdatePriority(contextMenu.itemId, newPriority)
            }}
            dateConfig={{
              dueDate: targetItem.due_date, /* [수정] 실시간 마감일 사용 */
              onDueDateChange: (newDate) => handleUpdateDueDate(contextMenu.itemId, newDate)
            }}
          />
        );
      })()}

      {editingItem && (() => {
        const item = findItemRecursive(currentProject.items, editingItem);
        return item ? (
          <EditModal
            item={item}
            onClose={() => setEditingItem(null)}
            onSave={handleEditItem}
          />
        ) : null;
      })()}

      {/* [추가] 새 작업 추가 입력 영역 */}


      <div>
        <div className="mb-6">
          <ToDoListDisplay
            todoList={currentProject}
            moveItem={moveItem}
            onDropItem={handleDropAndSave}
            onToggleItemComplete={handleToggleItemComplete}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onGenerateSubtasks={handleGenerateSubtasks}
            onOpenContextMenu={handleOpenContextMenu}
            onUpdateKeyword={handleUpdateKeyword}
            onUpdatePriority={handleUpdatePriority}
            isGenerating={isGenerating}
            generatingItemId={generatingItemId}
            onOpenQuickAdd={onOpenQuickAdd}
          />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
