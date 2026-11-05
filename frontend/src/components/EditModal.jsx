/**
 * 항목 수정 모달 컴포넌트
 * 
 * 할 일 항목의 내용을 수정하는 간단한 모달 창.
 * Ctrl+Enter 단축키로 저장, ESC로 취소 지원.
 * 
 * @module EditModal
 */
import React, { useState, useEffect } from 'react';


/**
 * EditModal 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {Object} props.item - 수정할 아이템 객체
 * @param {Function} props.onSave - 저장 콜백 (id, text)
 * @param {Function} props.onClose - 닫기 콜백
 * @returns {JSX.Element} 수정 모달
 */
function EditModal({ item, onSave, onClose }) {
  const [text, setText] = useState(item.description);

  useEffect(() => {
    setText(item.description);
  }, [item]);

  const handleSave = () => {
    if (text.trim()) {
      onSave(item.id, text.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/30 p-4 pt-[12vh] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
        className="w-full max-w-md rounded-md border border-rule bg-sheet p-5 shadow-pop animate-pop-in sm:p-6"
      >
        <h3 id="edit-modal-title" className="font-serif text-xl font-semibold tracking-tight text-ink">항목 수정</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mt-4 w-full resize-none rounded border border-rule-strong bg-paper p-3 text-[15px] leading-relaxed text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          rows="4"
          autoFocus
          aria-label="항목 내용"
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="hidden font-mono text-[11px] text-ink-3 sm:block">Ctrl+Enter 저장 · Esc 취소</p>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded px-4 text-sm text-ink-2 transition-colors hover:bg-paper-2 touch-manipulation"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="min-h-[40px] rounded bg-ink px-4 text-sm font-medium text-paper transition-colors hover:bg-ink-2 touch-manipulation"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditModal;
