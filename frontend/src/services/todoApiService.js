/**
 * 할 일 API 서비스 모듈
 * 
 * 할 일(Todo) 관련 API 호출 함수들을 제공.
 * 
 * 주요 기능:
 * - 프로젝트(Todo List) CRUD
 * - 할 일 아이템(Todo Item) CRUD
 * - AI 기반 목록/서브태스크 생성
 * - 자연어 파싱 기반 아이템 생성
 * 
 * @module todoApiService
 */
import api from './api';


/**
 * 사용자의 모든 프로젝트 목록 조회.
 * @returns {Promise<Array>} 프로젝트 배열
 */
export const getToDos = async () => {
  const response = await api.get('/todos');
  return response.data;
};


/**
 * AI 기반 프로젝트 생성.
 * 키워드를 입력하면 AI가 관련 할 일 목록을 자동 생성.
 * 
 * @param {string} keyword - 프로젝트 키워드 (예: "웹사이트 개발")
 * @returns {Promise<Object>} 생성된 프로젝트
 */
export const generateToDoList = async (keyword) => {
  const response = await api.post('/todos/generate', { keyword });
  return response.data;
};


/**
 * AI 기반 서브태스크 생성.
 * 상위 항목에서 세부 작업을 자동 생성.
 * 
 * @param {string} itemId - 상위 항목 ID
 * @returns {Promise<Object>} 서브태스크가 추가된 상위 항목
 */
export const generateSubtasks = async (itemId) => {
  const response = await api.post(`/todos/items/${itemId}/generate-subtasks`);
  return response.data;
};


/**
 * 프로젝트 정보 업데이트.
 * 
 * @param {string} listId - 프로젝트 ID
 * @param {Object} updateData - 업데이트할 데이터 (keyword, color, icon)
 * @returns {Promise<Object>} 업데이트된 프로젝트
 */
export const updateToDoList = async (listId, updateData) => {
  const response = await api.put(`/todos/${listId}`, updateData);
  return response.data;
};


/**
 * 할 일 아이템 업데이트.
 * 
 * @param {string} itemId - 아이템 ID
 * @param {Object} updateData - 업데이트할 데이터 (description, is_completed, order, priority, due_date)
 * @returns {Promise<Object>} 업데이트된 아이템
 */
export const updateToDoItem = async (itemId, updateData) => {
  const response = await api.put(`/todos/items/${itemId}`, updateData);
  return response.data;
};


/**
 * 할 일 아이템 삭제 (자식 포함).
 * 
 * @param {string} itemId - 삭제할 아이템 ID
 * @returns {Promise<void>}
 */
export const deleteToDoItem = async (itemId) => {
  await api.delete(`/todos/items/${itemId}`);
};


/**
 * 프로젝트 삭제 (모든 아이템 포함).
 * 
 * @param {string} listId - 삭제할 프로젝트 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteToDoList = async (listId) => {
  const response = await api.delete(`/todos/${listId}`);
  return response.data;
};


/**
 * 자연어 파싱 기반 아이템 생성.
 * 백엔드 AI가 텍스트를 분석하여 구조화된 작업으로 변환.
 * 
 * @param {string} text - 자연어 텍스트 (예: "내일까지 보고서 제출")
 * @param {string} listId - 추가할 프로젝트 ID
 * @returns {Promise<Object>} 생성된 아이템
 */
export const createTodoItemFromNaturalLanguage = async (text, listId) => {
  const response = await api.post('/todos/parse-and-create-item', { text, list_id: listId });
  return response.data;
};
