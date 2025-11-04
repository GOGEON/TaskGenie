import React, { useState } from 'react';

function KeywordInput({ onGenerate }) {
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    onGenerate(keyword);
    setKeyword('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2">
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="새로운 할 일 목록의 키워드를 입력하세요..."
        className="flex-grow p-3 sm:p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px] sm:min-h-0 transition-all focus:scale-[1.02]"
      />
      <button
        type="submit"
        className="px-4 sm:px-5 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base font-medium min-h-[44px] sm:min-h-0 touch-manipulation transition-all whitespace-nowrap hover-lift btn-ripple"
      >
        생성
      </button>
    </form>
  );
}

export default KeywordInput;
