/* [추가] 전역 빠른 추가 모달 컴포넌트 */
/* 목적: 어디서나 Ctrl/Cmd + K로 빠르게 작업을 추가할 수 있는 모달 */
/* [개선] Google Calendar 스타일의 심플한 UI */
import React, { useState, useRef, useEffect } from 'react';
import { getParserExamples, parseNaturalLanguage } from '../utils/nlpParser';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker.css";
import { ko } from 'date-fns/locale';

/* [추가] Helper 함수들 - 날짜 포맷팅 */
const formatDueDate = (isoDateString) => {
  if (!isoDateString) return null;
  
  const date = new Date(isoDateString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  // 날짜 부분
  let dateStr = '';
  if (date.toDateString() === now.toDateString()) {
    dateStr = '오늘';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    dateStr = '내일';
  } else {
    dateStr = `${month}월 ${day}일`;
  }
  
  // 시간 부분 (00:00이 아닐 때만 표시)
  if (hours !== 0 || minutes !== 0) {
    const period = hours < 12 ? '오전' : '오후';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes > 0 ? ` ${minutes}분` : '';
    dateStr += ` ${period} ${displayHours}시${displayMinutes}`;
  }
  
  return dateStr;
};

const formatDateForInput = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  const hasTime = !(date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0);
  return localDate.toISOString().slice(0, hasTime ? 16 : 10);
};

const toISOString = (localString) => {
  if (!localString) return null;
  if (localString.length === 10) {
    const dateWithTime = new Date(localString + 'T00:00:00');
    return dateWithTime.toISOString();
  }
  return new Date(localString).toISOString();
};

/**
 * QuickAddModal 컴포넌트
 * 전역 단축키(Ctrl/Cmd + K)로 빠르게 작업을 추가하는 모달
 */
const QuickAddModal = ({ isOpen, onClose, onSubmit, projects = [], activeProjectId = null }) => {
  const [text, setText] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(activeProjectId);
  const [error, setError] = useState('');
  const [placeholder, setPlaceholder] = useState('무엇을 해야 하나요?');
  const [parsedData, setParsedData] = useState(null);
  
  /* [추가] 수동 선택 state */
  // manualDueDate 제거 - 텍스트 파싱 결과(parsedData)를 진실의 원천으로 사용
  const [manualPriority, setManualPriority] = useState('none');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const inputRef = useRef(null);
  const datePickerRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setText('');
      setError('');
      setParsedData(null);
      setManualPriority('none');
      setShowDatePicker(false);
      setShowTimePicker(false);
      setPlaceholder(getParserExamples('ko'));
      
      if (activeProjectId) {
        setSelectedProjectId(activeProjectId);
      }
    }
  }, [isOpen, activeProjectId]);

  useEffect(() => {
    if (text.trim()) {
      const parsed = parseNaturalLanguage(text);
      setParsedData(parsed);
    } else {
      setParsedData(null);
    }
  }, [text]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedText = text.trim();
    
    if (!trimmedText) {
      setError('작업 내용을 입력해주세요.');
      return;
    }
    
    if (!selectedProjectId) {
      setError('프로젝트를 선택해주세요.');
      return;
    }
    
    onSubmit(trimmedText, selectedProjectId);
    
    setText('');
    setError('');
    setParsedData(null);
    setManualPriority('none');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDateChange = (e) => {
    const localValue = e.target.value;
    const isoDate = toISOString(localValue);
    // setManualDueDate(isoDate); // 제거
    
    /* [수정] 텍스트 필드에 날짜 추가 시 기존 날짜 표현 제거 */
    if (isoDate) {
      const formattedDate = formatDueDate(isoDate);
      setText(prev => {
        // 기존 날짜 표현 제거 (오늘, 내일, X월 X일 패턴 등)
        const withoutDate = prev
          .replace(/오늘(\s+(오전|오후)\s+\d{1,2}(:\d{2})?시)?/g, '')
          .replace(/내일(\s+(오전|오후)\s+\d{1,2}(:\d{2})?시)?/g, '')
          .replace(/모레(\s+(오전|오후)\s+\d{1,2}(:\d{2})?시)?/g, '')
          .replace(/(이번|다음|지난)\s*주(\s*말)?/g, '')
          .replace(/(이번|다음|지난)\s*달(\s*말)?/g, '')
          .replace(/\d{1,2}월\s+\d{1,2}일(\s+(오전|오후)\s+\d{1,2}시(\s+\d{1,2}분)?)?/g, '')
          .trim();
        return withoutDate ? `${withoutDate} ${formattedDate}` : formattedDate;
      });
    }
  };

  const handleDateClear = () => {
    // setManualDueDate(null); // 제거
    
    // 텍스트에서 날짜 표현 제거
    setText(prev => {
      return prev
        .replace(/오늘(\s+(오전|오후)\s+\d{1,2}(:\d{2})?시)?/g, '')
        .replace(/내일(\s+(오전|오후)\s+\d{1,2}(:\d{2})?시)?/g, '')
        .replace(/\d{1,2}월\s+\d{1,2}일(\s+(오전|오후)\s+\d{1,2}시(\s+\d{1,2}분)?)?/g, '')
        .trim();
    });
    
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const handlePriorityChange = () => {
    const currentIndex = priorities.findIndex(p => p.value === (finalPriority || 'none'));
    const nextIndex = (currentIndex + 1) % priorities.length;
    const nextPriority = priorities[nextIndex];
    setManualPriority(nextPriority.value);
    
    // 텍스트 필드에도 우선순위 추가
    if (nextPriority.value !== 'none') {
      const priorityText = `#${nextPriority.label}`;
      // 기존 우선순위 태그 제거
      const withoutPriority = text.replace(/#(높음|보통|낮음|긴급|중요)/g, '').trim();
      setText(withoutPriority ? `${withoutPriority} ${priorityText}` : priorityText);
    }
  };

  const finalDueDate = parsedData?.due_date; // manualDueDate 제거됨
  const finalPriority = manualPriority !== 'none' ? manualPriority : parsedData?.priority;

  const priorities = [
    { value: 'high', label: '높음', color: 'text-red-600', icon: '🔴' },
    { value: 'medium', label: '보통', color: 'text-orange-600', icon: '🟡' },
    { value: 'low', label: '낮음', color: 'text-blue-600', icon: '🟢' },
    { value: 'none', label: '없음', color: 'text-gray-500', icon: '○' }
  ];

  const currentPriority = priorities.find(p => p.value === (finalPriority || 'none'));

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-60 p-4"
      style={{ backgroundColor: 'rgba(16, 24, 40, 0.1)' }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-scaleIn">
        {/* 내용 */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* 제목 입력 */}
          <div className="mb-3">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 ${
                error 
                  ? 'border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:ring-blue-400'
              }`}
            />
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>

          {/* 인라인 컨트롤 */}
          <div className="mb-3 flex items-center gap-2 flex-wrap">
              {/* DatePicker 라이브러리 사용 */}
              <div className="relative">
                <DatePicker
                  key={showTimePicker ? 'with-time' : 'no-time'}
                  open={showDatePicker}
                  onInputClick={() => setShowDatePicker(true)}
                  onClickOutside={() => setShowDatePicker(false)}
                  selected={finalDueDate ? new Date(finalDueDate) : null}
                  onChange={(date) => {
                    if (!date) {
                      handleDateClear();
                      return;
                    }
                    // 로컬 시간으로 변환하여 ISO 문자열 생성
                    const offset = date.getTimezoneOffset() * 60000;
                    const localDate = new Date(date.getTime() - offset);
                    const isoString = localDate.toISOString();
                    
                    // 시간 정보가 있는 경우 (기본 00:00:00이 아닌 경우)
                    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
                    
                    // handleDateChange 호출 형식을 맞춤
                    handleDateChange({ 
                      target: { 
                        value: isoString.slice(0, hasTime ? 16 : 10) 
                      } 
                    });
                    
                    // 날짜 선택 후 달력 닫기 (시간 선택이 아닐 때만)
                    if (!showTimePicker) {
                      setShowDatePicker(false);
                    }
                  }}
                  showTimeSelect={showTimePicker}
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="시간"
                  dateFormat={showTimePicker ? "yyyy.MM.dd HH:mm" : "yyyy.MM.dd"}
                  locale={ko}
                  customInput={
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                    >
                      <i className="ri-calendar-line"></i>
                      <span>{finalDueDate ? formatDueDate(finalDueDate) : '날짜'}</span>
                    </button>
                  }
                  shouldCloseOnSelect={!showTimePicker}
                  popperClassName="react-datepicker-popper"
                  calendarClassName="custom-datepicker"
                  dayClassName={(date) => 
                    date.getDay() === 0 ? "text-red-500" : date.getDay() === 6 ? "text-blue-500" : undefined
                  }
                >
                  <div className="px-2 py-2 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                    <button
                      type="button"
                      onClick={() => setShowTimePicker(!showTimePicker)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      {showTimePicker ? '시간 숨기기' : '시간 추가'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDateClear();
                        // DatePicker 내부 상태 초기화를 위해 null 전달 필요하지만
                        // handleDateClear에서 이미 상태를 초기화하므로 닫기만 하면 됨
                        if (datePickerRef.current) {
                          datePickerRef.current.setOpen(false);
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      초기화
                    </button>
                  </div>
                </DatePicker>
              </div>

            {/* 우선순위 버튼 */}
            <button
              type="button"
              onClick={handlePriorityChange}
              className={`px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1.5 ${currentPriority.color}`}
            >
              <span>{currentPriority.icon}</span>
              <span>{currentPriority.label}</span>
            </button>
          </div>

          {/* 프로젝트 선택 */}
          <div className="mb-4">
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">📁 프로젝트 선택...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.keyword}
                </option>
              ))}
            </select>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!text.trim() || !selectedProjectId}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              작업 추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddModal;
