/**
 * 사용자 정의 날짜 선택 컴포넌트
 * 
 * react-datepicker를 래핑하여 커스텀 UI와 기능을 추가한 컴포넌트.
 * Google Calendar 스타일의 날짜/시간 선택 UX 제공.
 * 
 * 주요 기능:
 * - 날짜 선택 (인라인 캘린더)
 * - 시간 선택 (iOS 스타일 스크롤 피커 + 스마트 프리셋)
 * - 빠른 선택 옵션 (오늘, 내일, 다음 주, 이번 주말 등)
 * - 날짜 포맷팅 및 시각적 피드백
 * 
 * @module CustomDatePicker
 */
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
  RiMoonLine,
  RiCloseCircleLine
} from 'react-icons/ri';

import TimeScrollPicker from './TimeScrollPicker';
import "react-datepicker/dist/react-datepicker.css";
import '../datepicker.css';


/**
 * CustomDatePicker 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {Date|null} props.selectedDate - 현재 선택된 날짜 객체
 * @param {Function} props.onChange - 날짜 변경 콜백
 * @param {Function} props.onClose - 컴포넌트 닫기 콜백
 * @param {boolean} props.showTime - 시간 선택 모드 활성화 여부
 * @param {Function} props.onToggleTime - 시간 선택 모드 토글 콜백
 * @returns {JSX.Element} 날짜 선택기 요소
 */
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
    let str = format(date, 'M월 d일', { locale: ko });
    if (showTime || (date.getHours() !== 0 || date.getMinutes() !== 0)) {
        str += format(date, ' a h:mm', { locale: ko });
    }
    return str;
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
        // <!-- [수정] '다음 주' 버튼을 7일 뒤로 변경 (기존: 다음주 월요일) -->
        newDate = addDays(today, 7);
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

    // 시간 유지 로직
    if (newDate && selectedDate && showTime) {
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
    } else if (newDate && !showTime) {
        newDate.setHours(0, 0, 0, 0);
    }

    onChange(newDate);
    
    if (type !== 'time' && type !== 'repeat') {
        // 날짜 선택 시 자동으로 닫지 않음 (사용자가 확인하고 닫도록)
        // 또는 탭 전환을 유도?
        // 기존 로직: onClose();
        // 변경: 닫지 않음.
        onClose(); 
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-[280px] overflow-hidden flex flex-col animate-scaleIn origin-top-left">
      {/* 상단: 선택된 날짜 표시 */}
      <div className="p-3 border-b border-slate-100 bg-slate-50">
        <input
          type="text"
          value={selectedDate ? formatDate(selectedDate) : ''}
          placeholder="날짜 입력"
          className="w-full text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none bg-transparent text-center"
          readOnly
        />
      </div>

      {/* 탭 바 */}
      <div className="flex border-b border-slate-100">
        <button
          type="button"
          onClick={() => showTime && onToggleTime()}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
            !showTime 
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' 
              : 'text-slate-500 hover:bg-slate-50 bg-slate-50/50'
          }`}
        >
          <RiCalendarLine />
          날짜
        </button>
        <button
          type="button"
          onClick={() => !showTime && onToggleTime()}
          className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
            showTime 
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' 
              : 'text-slate-500 hover:bg-slate-50 bg-slate-50/50'
          }`}
        >
          <RiTimeLine />
          시간
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="relative">
        {!showTime ? (
          /* 날짜 선택 뷰 */
          <div className="animate-fadeIn">
            {/* 빠른 선택 목록 */}
            <div className="py-2">
              <button 
                onClick={() => handleQuickSelect('today')}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700"
              >
                <RiCalendarLine className="text-emerald-600 text-lg" />
                <span className="flex-1">오늘</span>
                <span className="text-xs text-slate-400">{format(new Date(), 'EEE', { locale: ko })}</span>
              </button>
              
              <button 
                onClick={() => handleQuickSelect('tomorrow')}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700"
              >
                <RiSunLine className="text-amber-500 text-lg" />
                <span className="flex-1">내일</span>
                <span className="text-xs text-slate-400">{format(addDays(new Date(), 1), 'EEE', { locale: ko })}</span>
              </button>

              <button 
                onClick={() => handleQuickSelect('nextWeek')}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700"
              >
                <RiCalendarEventLine className="text-purple-600 text-lg" />
                <span className="flex-1">다음 주</span>
                {/* <!-- [수정] 7일 뒤 날짜 표시 --> */}
                <span className="text-xs text-slate-400">{format(addDays(new Date(), 7), 'M월 d일', { locale: ko })}</span>
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
                  onClose();
                }}
                inline
                locale={ko}
                calendarClassName="border-0 shadow-none w-full"
                dayClassName={(date) => {
                  const today = new Date();
                  const isToday = date.getDate() === today.getDate() && 
                                date.getMonth() === today.getMonth() && 
                                date.getFullYear() === today.getFullYear();
                  
                  const isSelected = selectedDate && 
                                   date.getDate() === selectedDate.getDate() && 
                                   date.getMonth() === selectedDate.getMonth() && 
                                   date.getFullYear() === selectedDate.getFullYear();

                  return isToday && !isSelected ? "font-bold text-indigo-600" : undefined;
                }}
              />
            </div>
          </div>
        ) : (
          /* 시간 선택 뷰 */
          <div className="p-3 space-y-4 animate-fadeIn">
            {/* 1. iOS 스타일 시간 선택기 */}
            <div>
                <label className="text-xs font-semibold text-slate-500 mb-2 block">시간 설정</label>
                <TimeScrollPicker 
                  selectedDate={selectedDate} 
                  onChange={onChange} 
                />
                
                <button
                    type="button"
                    onClick={onToggleTime}
                    className="mt-2 w-full py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                    <RiCloseCircleLine />
                    시간 삭제
                </button>
            </div>

            {/* 2. 스마트 프리셋 */}
            <div>
                <label className="text-xs font-semibold text-slate-500 mb-2 block">추천 시간</label>
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
            
            <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center">
                    시간을 선택하면 알림이 설정됩니다.
                </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomDatePicker;
