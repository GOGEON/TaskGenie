import React from 'react';

const SkeletonToDoItem = ({ level = 0 }) => {
  return (
    <div 
      className="flex items-center justify-between py-1 border-t border-b border-gray-100 bg-white animate-pulse"
      style={{ paddingLeft: `${level * 2}rem` }}
    >
      <div className="flex items-center flex-grow min-w-0">
        {/* 드래그 핸들 스켈레톤 */}
        <div className="w-5 h-5 bg-gray-200 rounded mx-1"></div>
        
        {/* 화살표 영역 */}
        <div className="w-8"></div>
        
        {/* 체크박스 스켈레톤 */}
        <div className="w-5 h-5 bg-gray-200 rounded-full mx-2"></div>
        
        {/* 텍스트 스켈레톤 - 랜덤한 너비로 다양성 추가 */}
        <div 
          className="h-4 bg-gray-200 rounded flex-grow max-w-md"
          style={{ width: `${Math.random() * 40 + 30}%` }}
        ></div>
      </div>
      
      {/* 케밥 메뉴 스켈레톤 */}
      <div className="w-5 h-5 bg-gray-200 rounded ml-2"></div>
    </div>
  );
};

export default SkeletonToDoItem;
