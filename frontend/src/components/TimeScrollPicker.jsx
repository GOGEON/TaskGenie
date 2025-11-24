import React, { useEffect, useRef } from 'react';

const TimeScrollPicker = ({ selectedDate, onChange }) => {
  const date = selectedDate || new Date();
  
  // 시간 데이터 생성
  const ampm = ['오전', '오후'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10, ... 55

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
    const itemHeight = 32; // h-8
    const timeoutRef = useRef(null);

    // 무한 스크롤일 때만 데이터 3배 뻥튀기
    const displayItems = infinite ? [...items, ...items, ...items] : items;
    
    useEffect(() => {
      if (containerRef.current) {
        const selectedIndex = items.indexOf(selectedValue);
        if (selectedIndex !== -1) {
          // 무한 스크롤이면 중앙 세트, 아니면 그냥 해당 인덱스
          const targetIndex = infinite ? items.length + selectedIndex : selectedIndex;
          containerRef.current.scrollTop = targetIndex * itemHeight;
        }
      }
    }, [items, selectedValue, infinite]);

    const handleScroll = (e) => {
      const scrollTop = e.currentTarget.scrollTop;
      
      if (infinite) {
        const totalHeight = items.length * itemHeight;
        // 무한 스크롤 로직: 범위를 벗어나면 중앙으로 점프
        if (scrollTop < itemHeight) {
          e.currentTarget.scrollTop += totalHeight;
        } else if (scrollTop >= totalHeight * 2) {
          e.currentTarget.scrollTop -= totalHeight;
        }
      }

      // 선택 로직 (Debounce)
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        const centerIndex = Math.round(e.currentTarget.scrollTop / itemHeight);
        // 무한일 때는 모듈러 연산, 유한일 때는 인덱스 그대로 (범위 체크)
        const actualIndex = infinite ? centerIndex % items.length : Math.min(Math.max(centerIndex, 0), items.length - 1);
        
        const newItem = items[actualIndex];
        
        if (newItem !== undefined && newItem !== selectedValue) {
          onSelect(newItem);
        }
      }, 100);
    };

    return (
      <div 
        className="flex-1 h-32 overflow-y-auto no-scrollbar relative snap-y snap-mandatory scroll-smooth" 
        ref={containerRef}
        onScroll={handleScroll}
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="py-12">
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
              className={`h-8 flex items-center justify-center text-sm cursor-pointer snap-center transition-all ${
                item === selectedValue 
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
      {/* 선택 영역 하이라이트 바 (배경) */}
      <div className="absolute top-1/2 left-2 right-2 h-8 -mt-4 bg-slate-50 rounded-md -z-10 pointer-events-none" />
      
      <ScrollColumn 
        items={ampm} 
        selectedValue={currentAmPm} 
        onSelect={handleAmPmChange}
        infinite={false}
      />
      
      <div className="h-4 w-[1px] bg-slate-200" />
      
      <ScrollColumn 
        items={hours} 
        selectedValue={currentDisplayHour} 
        onSelect={handleHourChange} 
        formatItem={(h) => String(h).padStart(2, '0')}
      />
      
      <div className="text-slate-300 font-bold">:</div>
      
      <ScrollColumn 
        items={minutes} 
        selectedValue={currentMinute} 
        onSelect={handleMinuteChange} 
        formatItem={(m) => String(m).padStart(2, '0')}
      />
    </div>
  );
};

export default TimeScrollPicker;
