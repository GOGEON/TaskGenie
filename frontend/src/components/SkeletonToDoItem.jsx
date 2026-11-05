/**
 * 스켈레톤 할 일 아이템 컴포넌트
 *
 * AI가 하위 항목을 만드는 동안 표시되는 자리 표시자.
 * 실제 행(ToDoItem)과 같은 간격·높이를 갖는다.
 *
 * @module SkeletonToDoItem
 */
import React, { useMemo } from 'react';

const SkeletonToDoItem = () => {
  const width = useMemo(() => `${Math.round(Math.random() * 35 + 30)}%`, []);

  return (
    <li className="flex items-center border-b border-rule/70 py-1.5 pr-1" aria-hidden="true">
      {/* 드래그 핸들 + 펼치기 영역 자리 */}
      <div className="w-7 flex-shrink-0 sm:w-[52px]" />
      {/* 체크박스 */}
      <div className="flex h-8 items-center px-1">
        <div className="skeleton h-[18px] w-[18px] rounded-[4px]" />
      </div>
      {/* 텍스트 */}
      <div className="ml-1.5 flex-grow py-[5px]">
        <div className="skeleton h-3.5 rounded-sm" style={{ width }} />
      </div>
    </li>
  );
};

export default SkeletonToDoItem;
