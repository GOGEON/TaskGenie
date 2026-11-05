/* [추가] 키워드 입력 모달 컴포넌트 */
/* 이전: 브라우저 기본 prompt() 사용 - 단순하지만 스타일링 불가 */
/* 현재: 커스텀 모달 - 유효성 검증, 추천 키워드, 문자 수 제한 표시 */

/**
 * 키워드 입력 모달 컴포넌트
 * 
 * 새 프로젝트 생성 시 키워드를 입력받는 모달.
 * 유효성 검사(길이 제한)와 추천 키워드 기능을 제공.
 * 
 * @module KeywordInputModal
 */
import React, { useState, useRef, useEffect } from 'react';

/**
 * KeywordInputModal 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {boolean} props.isOpen - 모달 표시 여부
 * @param {Function} props.onClose - 모달 닫기 콜백
 * @param {Function} props.onSubmit - 키워드 제출 콜백
 * @param {string} [props.title="새 프로젝트 만들기"] - 모달 제목
 * @returns {JSX.Element|null} 키워드 입력 모달
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
      className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/30 p-4 pt-[12vh] animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyword-modal-title"
        className="w-full max-w-md rounded-md border border-rule bg-sheet shadow-pop animate-pop-in"
      >
        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <h2 id="keyword-modal-title" className="font-serif text-xl font-semibold tracking-tight text-ink">
            {title}
          </h2>
          <p className="mt-1.5 break-keep text-sm text-ink-3">
            키워드를 적으면 AI가 단계별 할 일 목록으로 나눠 적습니다.
          </p>

          <div className="mt-5">
            <label htmlFor="keyword-input" className="sr-only">
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
              placeholder="예: 이사 준비"
              className={`w-full rounded border bg-paper px-3.5 py-2.5 text-[15px] text-ink focus:outline-none focus:ring-1 ${
                error
                  ? 'border-accent focus:ring-accent'
                  : 'border-rule-strong focus:border-ink focus:ring-ink'
              }`}
              maxLength={50}
              aria-invalid={Boolean(error)}
            />

            <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
              {error && <p className="text-accent-ink">{error}</p>}
              <p className="ml-auto font-mono text-ink-4 tabular">{keyword.length}/50</p>
            </div>
          </div>

          {/* 예시 키워드 */}
          <div className="mt-4">
            <p className="mb-2 text-xs text-ink-3">이런 것도 됩니다</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setKeyword(suggestion.text)}
                  className="rounded-sm border border-rule px-2.5 py-1 text-sm text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm text-ink-2 transition-colors hover:bg-paper-2"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!keyword.trim()}
              className="rounded bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink-2 disabled:bg-ink-4"
            >
              만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KeywordInputModal;
