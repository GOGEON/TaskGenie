/**
 * 할 일 트리 유틸리티
 *
 * 할 일 항목은 `children` 배열을 가진 트리 구조로 관리된다.
 * 이 모듈의 함수들은 모두 순수 함수이며, 원본 배열을 변경하지 않고 새 배열을 반환한다.
 *
 * @module treeUtils
 */
import update from 'immutability-helper';

/**
 * 트리 구조에서 특정 ID의 항목 검색.
 *
 * @param {Array} items - 검색할 항목 배열
 * @param {string} itemId - 찾을 항목 ID
 * @returns {Object|null} 찾은 항목 또는 null
 */
export const findItem = (items, itemId) => {
  for (const item of items) {
    if (item.id === itemId) return item;
    if (item.children?.length) {
      const found = findItem(item.children, itemId);
      if (found) return found;
    }
  }
  return null;
};

/**
 * 특정 ID 항목에 변환 함수를 적용 (자식까지 재귀 탐색).
 *
 * @param {Array} items - 전체 항목 배열
 * @param {string} itemId - 대상 항목 ID
 * @param {Function} updater - (item) => newItem
 * @returns {Array} 변환된 항목 배열
 */
export const mapItem = (items, itemId, updater) =>
  items.map(item => {
    if (item.id === itemId) return updater(item);
    if (item.children?.length) {
      return { ...item, children: mapItem(item.children, itemId, updater) };
    }
    return item;
  });

/**
 * 특정 항목의 필드 일부를 갱신.
 *
 * @param {Array} items - 전체 항목 배열
 * @param {string} itemId - 대상 항목 ID
 * @param {Object} fields - 덮어쓸 필드
 * @returns {Array} 갱신된 항목 배열
 */
export const patchItem = (items, itemId, fields) =>
  mapItem(items, itemId, item => ({ ...item, ...fields }));

/**
 * 특정 항목을 통째로 교체.
 *
 * @param {Array} items - 전체 항목 배열
 * @param {Object} updatedItem - 교체할 항목 (id 포함)
 * @returns {Array} 교체된 항목 배열
 */
export const replaceItem = (items, updatedItem) =>
  mapItem(items, updatedItem.id, () => updatedItem);

/**
 * 트리 구조에서 특정 항목 삭제 (자식 포함).
 *
 * @param {Array} items - 전체 항목 배열
 * @param {string} itemId - 삭제할 항목 ID
 * @returns {Array} 삭제된 항목이 제외된 배열
 */
export const removeItem = (items, itemId) =>
  items
    .filter(item => String(item.id) !== String(itemId))
    .map(item =>
      item.children?.length
        ? { ...item, children: removeItem(item.children, itemId) }
        : item
    );

/**
 * 같은 부모 아래에서 항목 순서 이동.
 * parentId가 null이면 최상위 항목들 사이에서 이동한다.
 *
 * @param {Array} items - 전체 항목 배열
 * @param {string|null} parentId - 부모 항목 ID
 * @param {number} dragIndex - 드래그 시작 인덱스
 * @param {number} hoverIndex - 드랍 위치 인덱스
 * @returns {Array} 재정렬된 항목 배열
 */
export const moveSibling = (items, parentId, dragIndex, hoverIndex) => {
  const splice = list =>
    update(list, { $splice: [[dragIndex, 1], [hoverIndex, 0, list[dragIndex]]] });

  if (parentId === null) return splice(items);
  return mapItem(items, parentId, item => ({ ...item, children: splice(item.children) }));
};

/**
 * 항목과 모든 하위 항목의 완료 상태를 일괄 설정.
 *
 * @param {Object} item - 대상 항목
 * @param {boolean} isCompleted - 설정할 완료 상태
 * @returns {Object} 완료 상태가 변경된 항목
 */
const setCompletionDeep = (item, isCompleted) => ({
  ...item,
  is_completed: isCompleted,
  children: item.children?.length
    ? item.children.map(child => setCompletionDeep(child, isCompleted))
    : item.children,
});

/**
 * 특정 항목과 모든 하위 항목의 완료 상태 설정.
 *
 * @param {Array} items - 전체 항목 배열
 * @param {string} itemId - 대상 항목 ID
 * @param {boolean} isCompleted - 새 완료 상태
 * @returns {Array} 갱신된 항목 배열
 */
export const setItemCompletion = (items, itemId, isCompleted) =>
  mapItem(items, itemId, item => setCompletionDeep(item, isCompleted));

/**
 * 부모 항목의 완료 상태를 자식 상태에 맞게 동기화.
 * 모든 자식이 완료되면 부모도 완료, 하나라도 미완료면 부모도 미완료.
 * 하위에서 위로 계산하므로 한 번의 순회로 모든 단계가 반영된다.
 *
 * @param {Array} items - 동기화할 항목 배열
 * @returns {Array} 동기화된 항목 배열
 */
export const syncParentCompletion = (items) =>
  items.map(item => {
    if (!item.children?.length) return item;
    const children = syncParentCompletion(item.children);
    return { ...item, children, is_completed: children.every(child => child.is_completed) };
  });

/**
 * 모든 단계에서 미완료 항목을 위로, 완료 항목을 아래로 정렬 (같은 상태는 order 순).
 *
 * @param {Array} items - 정렬할 항목 배열
 * @returns {Array} 정렬된 새 배열
 */
export const sortByCompletion = (items) =>
  [...items]
    .sort((a, b) =>
      a.is_completed !== b.is_completed ? a.is_completed - b.is_completed : a.order - b.order
    )
    .map(item =>
      item.children?.length ? { ...item, children: sortByCompletion(item.children) } : item
    );

/**
 * 모든 단계에서 현재 배열 위치를 기준으로 order 재할당.
 *
 * @param {Array} items - 처리할 항목 배열
 * @returns {Array} order가 재할당된 배열
 */
export const reassignOrder = (items) =>
  items.map((item, index) => ({
    ...item,
    order: index,
    ...(item.children?.length && { children: reassignOrder(item.children) }),
  }));

/**
 * 트리를 깊이 우선으로 평탄화.
 *
 * @param {Array} items - 항목 배열
 * @returns {Array} 모든 항목의 1차원 배열
 */
export const flattenItems = (items) =>
  items.flatMap(item => [item, ...(item.children?.length ? flattenItems(item.children) : [])]);

/**
 * 이전 트리와 비교하여 완료 상태가 바뀐 (또는 새로 생긴) 항목 수집.
 *
 * @param {Array} before - 변경 전 항목 배열
 * @param {Array} after - 변경 후 항목 배열
 * @returns {Array<{id: string, is_completed: boolean}>} 변경된 항목 목록
 */
export const diffCompletion = (before, after) => {
  const previous = new Map(flattenItems(before).map(item => [item.id, item.is_completed]));
  return flattenItems(after)
    .filter(item => previous.get(item.id) !== item.is_completed)
    .map(({ id, is_completed }) => ({ id, is_completed }));
};

/**
 * 전체 항목 수 (하위 항목 포함).
 *
 * @param {Array} items - 항목 배열
 * @returns {number} 전체 항목 수
 */
export const countAllItems = (items = []) => flattenItems(items).length;

/**
 * 완료된 항목 수 (하위 항목 포함).
 *
 * @param {Array} items - 항목 배열
 * @returns {number} 완료된 항목 수
 */
export const countCompletedItems = (items = []) =>
  flattenItems(items).filter(item => item.is_completed).length;

/**
 * 계층별 가중치 진행률 (0~100).
 * 각 단계의 형제 항목들이 동등한 가중치를 가지며,
 * 하위 항목이 있는 항목은 하위 진행률로 대체된다. 항목이 없으면 100.
 *
 * @param {Array} items - 항목 배열
 * @returns {number} 진행률
 */
export const calculateProgress = (items) => {
  if (!items?.length) return 100;
  const total = items.reduce((sum, item) => {
    if (item.children?.length) return sum + calculateProgress(item.children) / 100;
    return sum + (item.is_completed ? 1 : 0);
  }, 0);
  return (total / items.length) * 100;
};
