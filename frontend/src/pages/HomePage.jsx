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
 * 
 * @module HomePage
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import ToDoListDisplay from '../components/ToDoListDisplay';
import ContextMenu from '../components/ContextMenu';
import EditModal from '../components/EditModal';
import {
  generateSubtasks,
  updateToDoItem,
  deleteToDoItem,
  updateToDoList,
} from '../services/todoApiService';
import {
  findItem,
  patchItem,
  replaceItem,
  markAncestorsIncomplete,
  removeItem,
  moveSibling,
  setItemCompletion,
  syncParentCompletion,
  sortByCompletion,
  reassignOrder,
  flattenItems,
  diffCompletion,
} from '../utils/treeUtils';


/**
 * 트리의 모든 항목 order를 서버에 저장.
 *
 * @param {Array} items - order가 할당된 항목 배열
 * @returns {Promise} 모든 저장 요청의 Promise
 */
const saveOrder = (items) =>
  Promise.all(flattenItems(items).map(({ id, order }) => updateToDoItem(id, { order })));


/**
 * 홈 페이지 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {Object} props.project - 현재 활성 프로젝트
 * @param {Function} props.setProjects - 전역 프로젝트 상태 설정 함수
 * @param {Function} props.onOpenQuickAdd - 빠른 추가 모달 열기 함수
 * @returns {JSX.Element} 홈 페이지 요소
 */
function HomePage({ project, setProjects, onOpenQuickAdd }) {
  // ==================== 컴포넌트 상태 ====================
  const [currentProject, setCurrentProject] = useState(project);
  const [contextMenu, setContextMenu] = useState(null);            // 컨텍스트 메뉴 상태
  const [editingItem, setEditingItem] = useState(null);            // 수정 중인 항목 ID
  const [generatingItemId, setGeneratingItemId] = useState(null);  // AI 생성 중인 항목 ID

  // 낙관적 업데이트를 위한 참조
  const projectRef = useRef(currentProject);
  const toggleQueueRef = useRef([]);          // 체크박스 토글 요청 큐
  const isProcessingQueueRef = useRef(false); // 큐 처리 중 여부

  useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  // currentProject가 변경될 때마다 projectRef 동기화
  useEffect(() => {
    projectRef.current = currentProject;
  }, [currentProject]);

  const updateGlobalProjectState = useCallback((updatedProject) => {
    setProjects(prevProjects =>
      prevProjects.map(p => (p.id === updatedProject.id ? updatedProject : p))
    );
  }, [setProjects]);

  /** 로컬 + 전역 프로젝트 상태를 함께 갱신 */
  const commitProject = useCallback((updatedProject) => {
    setCurrentProject(updatedProject);
    updateGlobalProjectState(updatedProject);
  }, [updateGlobalProjectState]);

  /**
   * 낙관적 업데이트 공통 처리.
   * UI를 먼저 갱신하고 서버 요청이 실패하면 이전 상태로 되돌린다.
   *
   * @param {Object} updatedProject - 즉시 반영할 프로젝트 상태
   * @param {Function} request - 서버 요청 함수
   * @param {{success: string, error: string}} messages - 토스트 메시지
   */
  const optimisticUpdate = async (updatedProject, request, messages) => {
    const previousProject = currentProject;
    commitProject(updatedProject);
    try {
      await request();
      toast.success(messages.success);
    } catch (err) {
      console.error(messages.error, err);
      toast.error(messages.error);
      commitProject(previousProject);
    }
  };

  /** 항목 트리를 변환한 프로젝트 상태 생성 */
  const withItems = (transform) => ({
    ...currentProject,
    items: transform(currentProject.items),
  });

  // ==================== 드래그 앤 드롭 ====================

  // 드래그 중 순서 변경. 드롭 직전 마지막 이동이 아직 렌더링되지 않았더라도
  // handleDropAndSave가 최신 순서를 저장하도록 projectRef도 즉시 갱신한다.
  const moveItem = useCallback((dragIndex, hoverIndex, parentId = null) => {
    const prev = projectRef.current;
    const updated = { ...prev, items: moveSibling(prev.items, parentId, dragIndex, hoverIndex) };
    projectRef.current = updated;
    setCurrentProject(updated);
  }, []);

  const handleDropAndSave = async () => {
    const latest = projectRef.current;
    const reorderedItems = reassignOrder(latest.items);
    try {
      await saveOrder(reorderedItems);
      updateGlobalProjectState({ ...latest, items: reorderedItems });
      toast.success('순서가 저장되었습니다.');
    } catch (err) {
      console.error('항목 순서 변경 중 오류 발생:', err);
      toast.error('항목 순서 변경에 실패했습니다.');
      setCurrentProject(project);
    }
  };

  // ==================== AI 하위 작업 생성 ====================

  const handleGenerateSubtasks = async (parentItemId) => {
    setGeneratingItemId(parentItemId);
    try {
      const updatedParentItem = await toast.promise(generateSubtasks(parentItemId), {
        loading: '세부 항목을 생성 중입니다...',
        success: '세부 항목이 성공적으로 생성되었습니다!',
        error: '세부 항목 생성에 실패했습니다.',
      });
      let items = replaceItem(projectRef.current.items, updatedParentItem);
      if (!updatedParentItem.is_completed) {
        // 서버가 완료된 조상들의 완료 상태를 해제하므로 로컬 상태도 맞춤
        items = markAncestorsIncomplete(items, updatedParentItem.id);
      }
      commitProject({ ...projectRef.current, items });
    } catch {
      /* toast가 에러 표시 */
    } finally {
      setGeneratingItemId(null);
    }
  };

  // ==================== 완료 상태 토글 ====================

  /**
   * 토글 큐 순차 처리.
   * 각 토글에서 완료 상태가 바뀐 항목(자동 동기화된 부모 포함)을 저장하고,
   * 큐가 비면 최종 order를 일괄 저장한다.
   */
  const processToggleQueue = useCallback(async () => {
    if (isProcessingQueueRef.current) return;
    isProcessingQueueRef.current = true;

    while (toggleQueueRef.current.length > 0) {
      const { before, after } = toggleQueueRef.current.shift();
      try {
        await Promise.all(
          diffCompletion(before, after).map(({ id, is_completed }) =>
            updateToDoItem(id, { is_completed })
          )
        );
        updateGlobalProjectState(projectRef.current);
      } catch (err) {
        console.error('할 일 항목 상태 업데이트 중 오류 발생:', err);
        toast.error('상태 업데이트에 실패했습니다. 페이지를 새로고침 해주세요.');
      }
    }

    try {
      await saveOrder(projectRef.current.items);
      updateGlobalProjectState(projectRef.current);
    } catch (err) {
      console.error('순서 업데이트 중 오류 발생:', err);
    }

    isProcessingQueueRef.current = false;
  }, [updateGlobalProjectState]);

  const handleToggleItemComplete = (itemId, isCompleted) => {
    const baseProject = projectRef.current;
    const before = baseProject.items;

    // 하위 항목까지 토글 → 부모 상태 동기화 → 완료 항목을 아래로 정렬 → order 재할당
    const after = reassignOrder(
      sortByCompletion(
        syncParentCompletion(setItemCompletion(before, itemId, isCompleted))
      )
    );

    // 즉시 낙관적 UI 업데이트 후 서버 저장은 큐로 순차 처리
    const updatedProject = { ...baseProject, items: after };
    projectRef.current = updatedProject;
    setCurrentProject(updatedProject);

    toggleQueueRef.current.push({ before, after });
    processToggleQueue();
  };

  // ==================== 항목/프로젝트 수정 ====================

  const handleEditItem = (itemId, newDescription) => {
    setEditingItem(null);
    return optimisticUpdate(
      withItems(items => patchItem(items, itemId, { description: newDescription })),
      () => updateToDoItem(itemId, { description: newDescription }),
      { success: '항목이 수정되었습니다.', error: '항목 수정에 실패했습니다.' }
    );
  };

  const handleUpdatePriority = (itemId, priority) =>
    optimisticUpdate(
      withItems(items => patchItem(items, itemId, { priority })),
      () => updateToDoItem(itemId, { priority }),
      { success: '우선순위가 변경되었습니다.', error: '우선순위 변경에 실패했습니다.' }
    );

  const handleUpdateDueDate = (itemId, dueDate) =>
    optimisticUpdate(
      withItems(items => patchItem(items, itemId, { due_date: dueDate })),
      () => updateToDoItem(itemId, { due_date: dueDate }),
      {
        success: dueDate ? '마감일이 설정되었습니다.' : '마감일이 제거되었습니다.',
        error: '마감일 변경에 실패했습니다.',
      }
    );

  const handleUpdateKeyword = (keyword) =>
    optimisticUpdate(
      { ...currentProject, keyword },
      () => updateToDoList(currentProject.id, { keyword }),
      { success: '프로젝트 이름이 변경되었습니다.', error: '프로젝트 이름 변경에 실패했습니다.' }
    );

  const handleDeleteItem = (itemId) => {
    if (!window.confirm('이 항목과 모든 하위 항목을 정말로 삭제하시겠습니까?')) return;
    return optimisticUpdate(
      withItems(items => removeItem(items, itemId)),
      () => deleteToDoItem(itemId),
      { success: '항목이 삭제되었습니다.', error: '항목 삭제에 실패했습니다.' }
    );
  };

  // ==================== 컨텍스트 메뉴 ====================

  const handleOpenContextMenu = (x, y, itemId) => {
    setContextMenu({ x, y, itemId });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  /** 메뉴 항목 클릭 시 동작 실행 후 메뉴 닫기 */
  const menuAction = (label, action) => ({
    label,
    onClick: () => {
      action(contextMenu.itemId);
      handleCloseContextMenu();
    },
  });

  const renderContextMenu = () => {
    // 메뉴가 열린 동안 최신 항목 데이터를 조회하여 우선순위/마감일 변경을 즉시 반영
    const targetItem = findItem(currentProject.items, contextMenu.itemId);
    if (!targetItem) return null;

    return (
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        options={[
          menuAction('하위 작업 생성', handleGenerateSubtasks),
          menuAction('수정', setEditingItem),
          menuAction('삭제', handleDeleteItem),
        ]}
        onClose={handleCloseContextMenu}
        priorityConfig={{
          currentPriority: targetItem.priority || 'none',
          onPriorityChange: (newPriority) => handleUpdatePriority(targetItem.id, newPriority),
        }}
        dateConfig={{
          dueDate: targetItem.due_date,
          onDueDateChange: (newDate) => handleUpdateDueDate(targetItem.id, newDate),
        }}
      />
    );
  };

  const renderEditModal = () => {
    const item = findItem(currentProject.items, editingItem);
    if (!item) return null;
    return <EditModal item={item} onClose={() => setEditingItem(null)} onSave={handleEditItem} />;
  };

  // ==================== 렌더링 ====================

  if (!currentProject) {
    return <div className="p-8 text-center text-slate-500">프로젝트를 불러오는 중...</div>;
  }

  return (
    <div className="container p-2 sm:p-4 md:p-8 max-w-5xl mx-auto" style={{ textAlign: 'left' }}>
      {contextMenu && renderContextMenu()}
      {editingItem && renderEditModal()}

      <div className="mb-6">
        <ToDoListDisplay
          todoList={currentProject}
          moveItem={moveItem}
          onDropItem={handleDropAndSave}
          onToggleItemComplete={handleToggleItemComplete}
          onOpenContextMenu={handleOpenContextMenu}
          onUpdateKeyword={handleUpdateKeyword}
          generatingItemId={generatingItemId}
          onOpenQuickAdd={onOpenQuickAdd}
        />
      </div>
    </div>
  );
}

export default HomePage;
