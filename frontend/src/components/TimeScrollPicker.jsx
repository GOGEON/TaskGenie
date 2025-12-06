/**
 * 시간 선택 스크롤 피커 컴포넌트
 * 
 * iOS 스타일의 스크롤 가능한 시간 선택 UI를 제공.
 * 오전/오후, 시(1-12), 분(5분 단위) 컬럼으로 구성됨.
 * 무한 스크롤 효과와 스냅(Snap) 스크롤 지원.
 * 
 * @module TimeScrollPicker
 */
import React, { useEffect, useRef } from 'react';

// 시간 데이터 생성 (컴포넌트 외부로 이동하여 불필요한 재생성 방지)
const AMPM_ITEMS = ['오전', '오후'];
const HOUR_ITEMS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_ITEMS = Array.from({ length: 12 }, (_, i) => i * 5);


/**
 * TimeScrollPicker 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {Date} props.selectedDate - 현재 선택된 날짜/시간
 * @param {Function} props.onChange - 시간 변경 콜백 (Date 객체 반환)
 * @returns {JSX.Element} 시간 선택 컴포넌트
 */
const TimeScrollPicker = ({ selectedDate, onChange }) => {
  const date = selectedDate || new Date();
  
  // 현재 값 추출
  const currentHours = date.getHours();
  const currentAmPm = currentHours < 12 ? '오전' : '오후';
  const currentDisplayHour = currentHours % 12 || 12;
  const currentMinute = Math.round(date.getMinutes() / 5) * 5 % 60; // 5분 단위 반올림

  // 스크롤 핸들러
  const handleAmPmChange = (val) => {
    const newDate = new Date(date);
    let h = newDate.getHours();
    
    if (val === '오전' && h >= 12) {
      h -= 12;
    } else if (val === '오후' && h < 12) {
      h += 12;
    }
    
    newDate.setHours(h);
    onChange(newDate);
  };

  const handleHourChange = (val) => {
    const newDate = new Date(date);
    let h = val;
    
    if (currentAmPm === '오후' && h !== 12) {
      h += 12;
    } else if (currentAmPm === '오전' && h === 12) {
      h = 0;
    }
    
    newDate.setHours(h);
    onChange(newDate);
  };

  const handleMinuteChange = (val) => {
    const newDate = new Date(date);
    newDate.setMinutes(val);
    onChange(newDate);
  };

  // 스크롤 아이템 컴포넌트
  const ScrollColumn = ({ items, selectedValue, onSelect, formatItem = (i) => i, infinite = true }) => {
    const containerRef = useRef(null);
    const itemHeight = 48; // h-12
    const timeoutRef = useRef(null);
    const [localSelected, setLocalSelected] = React.useState(selectedValue);

    // 무한 스크롤일 때만 데이터 3배 뻥튀기 (Memoization)
    const displayItems = React.useMemo(() => 
      infinite ? [...items, ...items, ...items] : items
    , [items, infinite]);
    
    useEffect(() => {
      setLocalSelected(selectedValue);
      if (containerRef.current) {
        const selectedIndex = items.indexOf(selectedValue);
        if (selectedIndex !== -1) {
          // 무한 스크롤이면 중앙 세트, 아니면 그냥 해당 인덱스
          const targetIndex = infinite ? items.length + selectedIndex : selectedIndex;
          // 스크롤이 튀는 것을 방지하기 위해 현재 스크롤 위치와 차이가 클 때만 이동하거나
          // 초기 로딩 시에만 이동하도록 할 수 있지만, 여기서는 단순화
          // 사용자가 스크롤 중이 아닐 때만 위치 보정
          if (!timeoutRef.current) {
             containerRef.current.scrollTop = targetIndex * itemHeight;
          }
        }
      }
    }, [items, selectedValue, infinite]);

    const handleScroll = (e) => {
      const scrollTop = e.currentTarget.scrollTop;
      
      if (infinite) {
        const totalHeight = items.length * itemHeight;
        // 무한 스크롤 로직
        if (scrollTop < itemHeight) {
          e.currentTarget.scrollTop += totalHeight;
        } else if (scrollTop >= totalHeight * 2) {
          e.currentTarget.scrollTop -= totalHeight;
        }
      }

      // 즉각적인 시각적 피드백을 위해 로컬 상태 업데이트
      const centerIndex = Math.round(e.currentTarget.scrollTop / itemHeight);
      const actualIndex = infinite ? centerIndex % items.length : Math.min(Math.max(centerIndex, 0), items.length - 1);
      const newItem = items[actualIndex];
      
      if (newItem !== undefined) {
        setLocalSelected(newItem);
      }

      // 선택 로직 (Debounce)
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        if (newItem !== undefined && newItem !== selectedValue) {
          onSelect(newItem);
        }
        timeoutRef.current = null;
      }, 100);
    };

    return (
      <div 
        className="flex-1 h-[240px] overflow-y-auto no-scrollbar relative snap-y snap-mandatory" 
        ref={containerRef}
        onScroll={handleScroll}
      >
        <div className="py-24">
          {displayItems.map((item, index) => (
            <div
              key={`${item}-${index}`}
              onClick={() => {
                 if (containerRef.current) {
                    const targetScrollTop = index * itemHeight;
                    containerRef.current.scrollTo({
                        top: targetScrollTop,
                        behavior: 'smooth'
                    });
                 }
              }}
              className={`h-12 flex items-center justify-center text-sm cursor-pointer snap-center transition-all ${
                item === localSelected 
                  ? 'font-bold text-indigo-600 scale-110' 
                  : 'text-slate-400 scale-100 opacity-50'
              }`}
            >
              {formatItem(item)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center gap-2 bg-white rounded-lg border border-slate-200 p-2 relative overflow-hidden">
      {/* 선택 영역 하이라이트 바 (배경 + 라인) */}
      <div className="absolute top-1/2 left-0 right-0 h-12 -mt-6 bg-slate-50/30 border-t border-b border-indigo-100 pointer-events-none" />
      
      <ScrollColumn 
        items={AMPM_ITEMS} 
        selectedValue={currentAmPm} 
        onSelect={handleAmPmChange}
        infinite={false}
      />

      <ScrollColumn 
        items={HOUR_ITEMS} 
        selectedValue={currentDisplayHour} 
        onSelect={handleHourChange} 
        formatItem={(h) => String(h)}
      />
      
      <ScrollColumn 
        items={MINUTE_ITEMS} 
        selectedValue={currentMinute} 
        onSelect={handleMinuteChange} 
        formatItem={(m) => String(m).padStart(2, '0')}
      />
    </div>
  );
};

export default TimeScrollPicker;
