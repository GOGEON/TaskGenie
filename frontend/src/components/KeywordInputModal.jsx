/* [추가] 키워드 입력 모달 컴포넌트 */
/* 이전: 브라우저 기본 prompt() 사용 - 단순하지만 스타일링 불가 */
/* 현재: 커스텀 모달 - 유효성 검증, 추천 키워드, 문자 수 제한 표시 */
import React, { useState, useRef, useEffect } from 'react';

/**
 * KeywordInputModal 컴포넌트
 * 프로젝트 키워드 입력을 위한 모달
 */
const KeywordInputModal = ({ isOpen, onClose, onSubmit, title = "새 프로젝트 만들기" }) => {
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  /* [추가] 모달 열릴 때 자동 포커스 및 초기화 */
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setKeyword('');
      setError('');
    }
  }, [isOpen]);

  /* [추가] 키워드 유효성 검증 - 2-50자 제한 */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedKeyword = keyword.trim();
    
    if (!trimmedKeyword) {
      setError('키워드를 입력해주세요.');
      return;
    }
    
    if (trimmedKeyword.length < 2) {
      setError('키워드는 최소 2자 이상이어야 합니다.');
      return;
    }
    
    if (trimmedKeyword.length > 50) {
      setError('키워드는 50자 이하로 입력해주세요.');
      return;
    }
    
    onSubmit(trimmedKeyword);
    setKeyword('');
    setError('');
  };

  /* [추가] ESC 키로 모달 닫기 */
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  /* [추가] 배경 클릭 시 모달 닫기 */
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  /* [추가] 추천 키워드 예시 (이전: 이모지와 설명 포함, 현재: 단순화) */
  const suggestions = [
    { text: '운동하기' },
    { text: '프로젝트 기획' },
    { text: '여행 준비' },
    { text: '시험 공부' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {title}
          </h2>
        </div>

        {/* 내용 */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* 입력창 */}
          <div className="mb-4">
            <label htmlFor="keyword-input" className="block text-sm font-medium text-gray-700 mb-2">
              프로젝트 키워드
            </label>
            <input
              ref={inputRef}
              id="keyword-input"
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="예: 운동하기"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                error 
                  ? 'border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:ring-blue-200'
              }`}
              maxLength={50}
            />
            
            {/* [추가] 에러 메시지 및 문자 수 카운터 */}
            <div className="flex items-center justify-between mt-2">
              {error && (
                <p className="text-red-500 text-xs">{error}</p>
              )}
              <p className="text-gray-400 text-xs ml-auto">{keyword.length}/50</p>
            </div>
          </div>

          {/* [추가] 추천 키워드 버튼 - 빠른 입력 지원 */}
          {/* [수정] 단순화된 디자인 (이전: 이모지, 설명 포함) */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-2">추천 키워드</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setKeyword(suggestion.text)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 transition-colors"
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          </div>

          {/* [수정] 단순화된 버튼 디자인 (이전: 그라데이션 배경) */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!keyword.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              생성하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KeywordInputModal;
