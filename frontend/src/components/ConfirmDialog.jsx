import React from 'react';

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = '확인', cancelText = '취소', isDangerous = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-scaleIn">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 active:bg-gray-400 transition-all hover-lift min-h-[44px] sm:min-h-0 touch-manipulation"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-md transition-all hover-lift btn-ripple min-h-[44px] sm:min-h-0 touch-manipulation ${
              isDangerous 
                ? 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800' 
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
