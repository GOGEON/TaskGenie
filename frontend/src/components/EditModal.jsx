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
      className="fixed inset-0 flex items-center justify-center z-[60] p-4"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.1)' }}
    >
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-md mx-4 animate-scaleIn">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-slate-800">항목 수정</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-3 sm:p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base resize-none transition-all"
          rows="4"
          autoFocus
        />
        <div className="text-xs sm:text-sm text-slate-500 mt-2">
          Ctrl+Enter로 저장, Esc로 취소
        </div>
        <div className="flex justify-end gap-2 sm:gap-4 mt-4">
          <button 
            onClick={onClose} 
            className="px-4 sm:px-5 py-2.5 sm:py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 active:bg-slate-300 text-sm sm:text-base min-h-[44px] sm:min-h-0 touch-manipulation transition-all hover-lift"
          >
            취소
          </button>
          <button 
            onClick={handleSave} 
            className="px-4 sm:px-5 py-2.5 sm:py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 active:bg-indigo-800 text-sm sm:text-base min-h-[44px] sm:min-h-0 touch-manipulation transition-all hover-lift btn-ripple"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditModal;
