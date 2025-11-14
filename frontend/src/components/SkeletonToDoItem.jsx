import React from 'react';

{/* <!-- [수정] 스켈레톤 UI가 실제 UI와 일치하도록 구조 및 스타일 수정 --> */}
const SkeletonToDoItem = () => {
  return (
    <li 
      className="flex items-center justify-between py-2 sm:py-1 border-t border-b border-l-4 border-gray-100 bg-white animate-pulse"
    >
      <div className="flex items-center flex-grow min-w-0">
        {/* 드래그 핸들 스켈레톤 */}
        <div className="p-1 flex-shrink-0">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
        </div>
        
        {/* 화살표 영역 */}
        <div className="w-8 sm:w-8 text-center flex-shrink-0">
            {/* 이 영역은 비워두거나, 필요 시 스켈레톤 아이콘 추가 */}
        </div>
        
        {/* 체크박스 스켈레톤 */}
        <div className="w-5 h-5 bg-gray-200 rounded-full mx-2 flex-shrink-0"></div>
        
        {/* 텍스트 스켈레톤 */}
        <div className="p-1 flex-grow">
            <div 
              className="h-4 bg-gray-200 rounded"
              style={{ width: `${Math.random() * 40 + 30}%` }}
            ></div>
        </div>
      </div>
      
      {/* 케밥 메뉴 스켈레톤 */}
      <div className="flex-shrink-0 ml-2">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
      </div>
    </li>
  );
};

export default SkeletonToDoItem;