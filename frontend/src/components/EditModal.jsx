import React, { useState, useEffect } from 'react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-md mx-4 animate-scaleIn">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">항목 수정</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-3 sm:p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base resize-none transition-all"
          rows="4"
          autoFocus
        />
        <div className="text-xs sm:text-sm text-gray-500 mt-2">
          Ctrl+Enter로 저장, Esc로 취소
        </div>
        <div className="flex justify-end gap-2 sm:gap-4 mt-4">
          <button 
            onClick={onClose} 
            className="px-4 sm:px-5 py-2.5 sm:py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 active:bg-gray-400 text-sm sm:text-base min-h-[44px] sm:min-h-0 touch-manipulation transition-all hover-lift"
          >
            취소
          </button>
          <button 
            onClick={handleSave} 
            className="px-4 sm:px-5 py-2.5 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 text-sm sm:text-base min-h-[44px] sm:min-h-0 touch-manipulation transition-all hover-lift btn-ripple"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditModal;
