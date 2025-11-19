/* [추가] 전역 빠른 추가 모달 컴포넌트 */
/* 목적: 어디서나 Ctrl/Cmd + K로 빠르게 작업을 추가할 수 있는 모달 */
import React, { useState, useRef, useEffect } from 'react';

/**
 * QuickAddModal 컴포넌트
 * 전역 단축키(Ctrl/Cmd + K)로 빠르게 작업을 추가하는 모달
 * 
 * @param {boolean} isOpen - 모달 열림/닫힘 상태
 * @param {function} onClose - 모달 닫기 콜백
 * @param {function} onSubmit - 작업 추가 콜백 (text, projectId)
 * @param {array} projects - 프로젝트 목록
 * @param {string} activeProjectId - 현재 활성 프로젝트 ID
 */
const QuickAddModal = ({ isOpen, onClose, onSubmit, projects = [], activeProjectId = null }) => {
  const [text, setText] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(activeProjectId);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  /* [추가] 모달 열릴 때 자동 포커스 및 초기화 */
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setText('');
      setError('');
      // 활성 프로젝트가 있으면 자동 선택
      if (activeProjectId) {
        setSelectedProjectId(activeProjectId);
      }
    }
  }, [isOpen, activeProjectId]);

  /* [추가] 작업 추가 처리 */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedText = text.trim();
    
    if (!trimmedText) {
      setError('작업 내용을 입력해주세요.');
      return;
    }
    
    if (!selectedProjectId) {
      setError('프로젝트를 선택해주세요.');
      return;
    }
    
    // 부모 컴포넌트에 작업 추가 요청
    onSubmit(trimmedText, selectedProjectId);
    
    // 초기화
    setText('');
    setError('');
  };

  /* [추가] ESC 키로 모달 닫기, Enter로 제출 */
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // Shift+Enter는 줄바꿈, Enter만 누르면 제출
      handleSubmit(e);
    }
  };

  /* [추가] 배경 클릭 시 모달 닫기 */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-60 p-4"
      style={{ backgroundColor: 'rgba(16, 24, 40, 0.1)' }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full animate-scaleIn">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              ⚡ 빠른 추가
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="닫기"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>
        </div>

        {/* 내용 */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* 입력창 */}
          <div className="mb-4">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="무엇을 해야 하나요?"
              className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 ${
                error 
                  ? 'border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:ring-blue-200'
              }`}
            />
            
            {/* [추가] 에러 메시지 */}
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* 프로젝트 선택 */}
          <div className="mb-4">
            <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-2">
              프로젝트
            </label>
            <select
              id="project-select"
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">프로젝트 선택...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.keyword}
                </option>
              ))}
            </select>
          </div>

          {/* [수정] 도움말 텍스트 - AI 파싱 제거로 즉시 생성 */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 <strong>팁:</strong> 작업이 즉시 추가됩니다. 우선순위와 마감일은 나중에 설정할 수 있습니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소 <span className="text-xs text-gray-400">(ESC)</span>
            </button>
            <button
              type="submit"
              disabled={!text.trim() || !selectedProjectId}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              추가하기 <span className="text-xs opacity-75">(Enter)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddModal;
