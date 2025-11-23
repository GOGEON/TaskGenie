import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { addDays, nextSaturday, nextMonday, format } from 'date-fns';
import { 
  RiCalendarLine, 
  RiSunLine, 
  RiCalendarEventLine, 
  RiCupLine, 
  RiCalendarCloseLine,
  RiTimeLine,
  RiMoonLine
} from 'react-icons/ri';

import "react-datepicker/dist/react-datepicker.css";
import '../datepicker.css';

const CustomDatePicker = ({ 
  selectedDate, 
  onChange, 
  onClose, 
  showTime, 
  onToggleTime 
}) => {
  // 날짜 포맷팅 함수
  const formatDate = (date) => {
    if (!date) return '';
    return format(date, 'M월 d일', { locale: ko });
  };

  // 빠른 액션 핸들러
  const handleQuickSelect = (type) => {
    const today = new Date();
    let newDate = null;

    switch (type) {
      case 'today':
        newDate = today;
        break;
      case 'tomorrow':
        newDate = addDays(today, 1);
        break;
      case 'nextWeek':
        newDate = nextMonday(today);
        break;
      case 'weekend':
        newDate = nextSaturday(today);
        break;
      case 'noDate':
        newDate = null;
        break;
      default:
        break;
    }

    // 시간 유지 로직 (기존에 시간이 설정되어 있었다면 유지)
    if (newDate && selectedDate && showTime) {
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
    } else if (newDate && !showTime) {
        // 시간이 꺼져있으면 00:00으로 리셋 (선택사항, 혹은 기본값)
        newDate.setHours(0, 0, 0, 0);
    }

    onChange(newDate);
    // 날짜 없음이 아니면 닫기? 보통 Todoist는 날짜 누르면 바로 적용되고 닫힘.
    // 하지만 시간 선택이 필요할 수 있으므로, 여기서는 상위에서 제어하거나
    // 일단 변경만 알리고 닫는 건 사용자가 결정하게 둠. 
    // (User request implies "setting" the date, so closing makes sense for quick actions)
    if (type !== 'time' && type !== 'repeat') {
        onClose();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-[280px] overflow-hidden flex flex-col animate-scaleIn origin-top-left">
      {/* 상단: 선택된 날짜 표시 (이미지에는 입력창처럼 보임) */}
      <div className="p-3 border-b border-slate-100">
        <input
          type="text"
          value={selectedDate ? formatDate(selectedDate) : ''}
          placeholder="날짜 입력"
          className="w-full text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none bg-transparent"
          readOnly // 일단 읽기 전용으로
        />
      </div>

      {/* 빠른 선택 목록 */}
      <div className="py-2">
        <button 
          onClick={() => handleQuickSelect('today')}
          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700"
        >
          <RiCalendarLine className="text-green-600 text-lg" />
          <span className="flex-1">오늘</span>
          <span className="text-xs text-slate-400">{format(new Date(), 'EEE', { locale: ko })}</span>
        </button>
        
        <button 
          onClick={() => handleQuickSelect('tomorrow')}
          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700"
        >
          <RiSunLine className="text-orange-500 text-lg" />
          <span className="flex-1">내일</span>
          <span className="text-xs text-slate-400">{format(addDays(new Date(), 1), 'EEE', { locale: ko })}</span>
        </button>

        <button 
          onClick={() => handleQuickSelect('nextWeek')}
          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700"
        >
          <RiCalendarEventLine className="text-purple-600 text-lg" />
          <span className="flex-1">다음 주</span>
          <span className="text-xs text-slate-400">{format(nextMonday(new Date()), 'M월 d일', { locale: ko })}</span>
        </button>

        <button 
          onClick={() => handleQuickSelect('weekend')}
          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700"
        >
          <RiCupLine className="text-indigo-500 text-lg" />
          <span className="flex-1">이번 주말</span>
          <span className="text-xs text-slate-400">{format(nextSaturday(new Date()), 'M월 d일', { locale: ko })}</span>
        </button>

        <button 
          onClick={() => handleQuickSelect('noDate')}
          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700 border-t border-slate-100 mt-1 pt-2"
        >
          <RiCalendarCloseLine className="text-slate-400 text-lg" />
          <span className="flex-1">날짜 없음</span>
        </button>
      </div>

      <div className="border-t border-slate-100"></div>

      {/* 달력 (인라인) */}
      <div className="p-2 custom-datepicker-inline-container">
        <DatePicker
          selected={selectedDate}
          onChange={(date) => {
            onChange(date);
            // 달력에서 날짜 클릭 시에는 닫지 않고 사용자가 명시적으로 닫거나, 
            // 혹은 Todoist처럼 바로 닫히게 할 수도 있음. 
            // 여기서는 시간 선택의 여지를 주기 위해 유지하거나, 
            // UX상 날짜 찍으면 닫히는게 일반적이므로 닫음. 
            // 단, 시간 선택 모드일때는?
            if (!showTime) onClose();
          }}
          inline
          locale={ko}
          calendarClassName="border-0 shadow-none w-full"
          dayClassName={(date) => 
            date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() 
              ? "font-bold text-indigo-600" 
              : undefined
          }
        />
      </div>

      {/* 하단 액션 (시간) */}
      <div className="border-t border-slate-100 p-2 flex items-center justify-between bg-slate-50">
        <button 
          type="button"
          onClick={onToggleTime}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            showTime ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-200 text-slate-600'
          }`}
        >
          <RiTimeLine />
          {showTime ? '시간 숨기기' : '시간'}
        </button>
      </div>
      
      {/* 시간 선택기가 켜져있을 때 표시할 추가 UI (옵션) */}
      {/* 시간 선택기가 켜져있을 때 표시할 추가 UI */}
      {showTime && (
        <div className="border-t border-slate-100 bg-white animate-slideInFromTop">
            <div className="p-3 space-y-3">
                {/* 1. 직접 입력 (Native Time Input) */}
                <div className="relative">
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">시간 설정</label>
                    <input 
                        type="time"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all"
                        value={selectedDate ? format(selectedDate, 'HH:mm') : ''}
                        onChange={(e) => {
                            if (!e.target.value) return;
                            const [h, m] = e.target.value.split(':').map(Number);
                            const newDate = selectedDate ? new Date(selectedDate) : new Date();
                            newDate.setHours(h, m);
                            onChange(newDate);
                        }}
                    />
                </div>

                {/* 2. 스마트 프리셋 */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">추천 시간</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: '아침', time: '09:00', icon: <RiSunLine className="text-orange-400" /> },
                            { label: '오후', time: '13:00', icon: <RiSunLine className="text-yellow-500" /> },
                            { label: '저녁', time: '18:00', icon: <RiMoonLine className="text-indigo-400" /> },
                            { label: '밤', time: '21:00', icon: <RiMoonLine className="text-purple-500" /> }
                        ].map(preset => (
                            <button
                                key={preset.time}
                                onClick={() => {
                                    const [h, m] = preset.time.split(':').map(Number);
                                    const newDate = selectedDate ? new Date(selectedDate) : new Date();
                                    newDate.setHours(h, m);
                                    onChange(newDate);
                                }}
                                className="flex items-center gap-2 px-3 py-2 border border-slate-100 rounded-lg hover:bg-indigo-50 hover:border-indigo-100 transition-all group"
                            >
                                <span className="group-hover:scale-110 transition-transform">{preset.icon}</span>
                                <div className="flex flex-col items-start">
                                    <span className="text-xs font-medium text-slate-700">{preset.label}</span>
                                    <span className="text-[10px] text-slate-400">{preset.time}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
