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
import React from 'react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import { addDays, nextSaturday, format } from 'date-fns';
import { 
  RiCalendarLine, 
  RiSunLine, 
  RiCalendarEventLine, 
  RiCupLine, 
  RiCalendarCloseLine,
  RiTimeLine,
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

  const quickOptions = [
    { type: 'today', label: '오늘', icon: RiCalendarLine, hint: format(new Date(), 'EEE', { locale: ko }) },
    { type: 'tomorrow', label: '내일', icon: RiSunLine, hint: format(addDays(new Date(), 1), 'EEE', { locale: ko }) },
    // 다음 주 = 7일 뒤
    { type: 'nextWeek', label: '다음 주', icon: RiCalendarEventLine, hint: format(addDays(new Date(), 7), 'M.d') },
    { type: 'weekend', label: '이번 주말', icon: RiCupLine, hint: format(nextSaturday(new Date()), 'M.d') },
  ];

  const tabClass = (active) =>
    `flex flex-1 items-center justify-center gap-1 border-b-2 py-2 text-xs transition-colors ${
      active ? 'border-ink font-medium text-ink' : 'border-transparent text-ink-3 hover:text-ink'
    }`;

  return (
    <div className="flex w-[280px] flex-col overflow-hidden rounded-md border border-rule bg-sheet shadow-pop animate-pop-in">
      {/* 선택된 날짜 */}
      <div className="border-b border-rule px-3 py-2.5">
        <p className={`text-center font-mono text-[13px] tabular ${selectedDate ? 'text-ink' : 'text-ink-4'}`}>
          {selectedDate ? formatDate(selectedDate) : '날짜 없음'}
        </p>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-rule">
        <button type="button" onClick={() => showTime && onToggleTime()} className={tabClass(!showTime)}>
          <RiCalendarLine aria-hidden="true" />
          날짜
        </button>
        <button type="button" onClick={() => !showTime && onToggleTime()} className={tabClass(showTime)}>
          <RiTimeLine aria-hidden="true" />
          시간
        </button>
      </div>

      <div className="relative">
        {!showTime ? (
          /* 날짜 선택 */
          <div className="animate-fade-in">
            <div className="py-1">
              {quickOptions.map(({ type, label, icon, hint }) => {
                const Icon = icon;
                return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleQuickSelect(type)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-ink-2 hover:bg-paper-2 hover:text-ink"
                >
                  <Icon className="text-base text-ink-3" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  <span className="font-mono text-[11px] text-ink-3 tabular">{hint}</span>
                </button>
                );
              })}
              <button
                type="button"
                onClick={() => handleQuickSelect('noDate')}
                className="mt-1 flex w-full items-center gap-3 border-t border-rule px-3 py-2 text-left text-sm text-ink-3 hover:bg-paper-2 hover:text-ink"
              >
                <RiCalendarCloseLine className="text-base" aria-hidden="true" />
                <span className="flex-1">날짜 없음</span>
              </button>
            </div>

            {/* 달력 */}
            <div className="custom-datepicker-inline-container border-t border-rule p-2">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  onChange(date);
                  onClose();
                }}
                inline
                locale={ko}
                calendarClassName="border-0 shadow-none w-full"
              />
            </div>
          </div>
        ) : (
          /* 시간 선택 */
          <div className="space-y-4 p-3 animate-fade-in">
            <div>
              <p className="mb-2 text-xs text-ink-3">시간</p>
              <TimeScrollPicker selectedDate={selectedDate} onChange={onChange} />
              <button
                type="button"
                onClick={onToggleTime}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded py-2 text-xs text-ink-3 transition-colors hover:bg-accent-wash hover:text-accent-ink"
              >
                <RiCloseCircleLine aria-hidden="true" />
                시간 지우기
              </button>
            </div>

            <div>
              <p className="mb-2 text-xs text-ink-3">자주 쓰는 시간</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '아침', time: '09:00' },
                  { label: '점심', time: '13:00' },
                  { label: '저녁', time: '18:00' },
                  { label: '밤', time: '21:00' },
                ].map((preset) => (
                  <button
                    key={preset.time}
                    type="button"
                    onClick={() => {
                      const [h, m] = preset.time.split(':').map(Number);
                      const newDate = selectedDate ? new Date(selectedDate) : new Date();
                      newDate.setHours(h, m);
                      onChange(newDate);
                    }}
                    className="flex flex-col items-center rounded border border-rule py-1.5 transition-colors hover:border-ink-3"
                  >
                    <span className="text-xs text-ink">{preset.label}</span>
                    <span className="font-mono text-[10px] text-ink-3">{preset.time}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomDatePicker;
