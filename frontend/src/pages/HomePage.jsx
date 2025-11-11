import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import update from 'immutability-helper';
import ToDoListDisplay from '../components/ToDoListDisplay';
import ContextMenu from '../components/ContextMenu';
import EditModal from '../components/EditModal';
import SkeletonToDoItem from '../components/SkeletonToDoItem';
/* [삭제] KeywordInput 컴포넌트 제거 (이전: 메인 화면 상단 키워드 입력 영역) */
import {
  generateSubtasks,
  updateToDoItem,
  deleteToDoItem,
  deleteToDoList,
  updateToDoList,
  createTodoItemFromNaturalLanguage,
} from '../services/todoApiService';

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

// Helper functions
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

function HomePage({ project, setProjects, triggerRefetch }) {
  const [currentProject, setCurrentProject] = useState(project);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingItemId, setGeneratingItemId] = useState(null);
  const taskInputRef = React.useRef(null);

  useEffect(() => {
    setCurrentProject(project);
  }, [project]);

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

  const handleToggleItemComplete = async (itemId, isCompleted) => {
    // Optimistic UI update
    const itemsWithToggledChildren = toggleItemAndChildren(currentProject.items, itemId, isCompleted);
    const syncedItems = synchronizeParentStates(itemsWithToggledChildren);
    
    // 변경된 항목들을 찾기 위해 원본과 비교
    const findChangedItems = (oldItems, newItems) => {
      const changes = [];
      const compare = (oldList, newList) => {
        newList.forEach((newItem) => {
          const oldItem = oldList.find(old => old.id === newItem.id);
          if (oldItem && oldItem.is_completed !== newItem.is_completed) {
            changes.push({ id: newItem.id, is_completed: newItem.is_completed });
          }
          if (newItem.children?.length) {
            const oldChildren = oldItem?.children || [];
            compare(oldChildren, newItem.children);
          }
        });
      };
      compare(oldItems, newItems);
      return changes;
    };
    
    const changedItems = findChangedItems(currentProject.items, syncedItems);
    
    // 재귀적으로 모든 레벨에서 완료된 항목을 하단으로 이동 (정렬)
    const sortItemsRecursively = (items) => {
      return items
        .sort((a, b) => {
          if (a.is_completed !== b.is_completed) {
            return a.is_completed - b.is_completed; // false(0) < true(1), 완료되지 않은 항목이 위로
          }
          return a.order - b.order; // 같은 완료 상태면 order 순서 유지
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
    const updatedProject = { ...currentProject, items: reorderedItems };
    setCurrentProject(updatedProject);

    try {
      // 변경된 모든 항목의 체크 상태를 업데이트
      const completionPromises = changedItems.map(item =>
        updateToDoItem(item.id, { is_completed: item.is_completed })
      );
      await Promise.all(completionPromises);
      
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
      
      // 순서도 함께 저장
      const orderPromises = allItemsToUpdate.map(item =>
        updateToDoItem(item.id, { order: item.order })
      );
      await Promise.all(orderPromises);
      
      updateGlobalProjectState(updatedProject);
    } catch (err) {
      console.error('할 일 항목 상태 업데이트 중 오류 발생:', err);
      toast.error("상태 업데이트에 실패했습니다. 페이지를 새로고침 해주세요.");
      setCurrentProject(project);
    }
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
    if (window.confirm('이 항목과 모든 하위 항목을 정말로 삭제하시겠습니까?')) {
      const updatedItems = deleteItemRecursive(currentProject.items, itemId);
      const updatedProject = { ...currentProject, items: updatedItems };
      setCurrentProject(updatedProject);
      updateGlobalProjectState(updatedProject);

      try {
        await deleteToDoItem(itemId);
        toast.success("항목이 삭제되었습니다.");
      } catch (err) {
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
    return <div className="p-8 text-center text-gray-500">프로젝트를 불러오는 중...</div>;
  }

  return (
    <div className="container p-8 max-w-5xl mx-auto" style={{ textAlign: 'left' }}>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={contextMenuOptions}
          onClose={handleCloseContextMenu}
          priorityConfig={{
            currentPriority: contextMenu.currentPriority,
            onPriorityChange: (newPriority) => handleUpdatePriority(contextMenu.itemId, newPriority)
          }}
          dateConfig={{
            dueDate: contextMenu.dueDate,
            onDueDateChange: (newDate) => handleUpdateDueDate(contextMenu.itemId, newDate)
          }}
        />
      )}

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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
          </div>
          <input 
            type="text" 
            placeholder="새 작업을 추가하세요... (예: 내일까지 보고서 제출)" 
            className="flex-1 text-sm text-gray-600 border-none outline-none bg-transparent"
            onKeyPress={handleAddTask}
            ref={taskInputRef}
          />
        </div>
      </div>

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
          />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
