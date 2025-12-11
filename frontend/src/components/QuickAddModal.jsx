/**
 * 빠른 추가 모달 컴포넌트
 * 
 * 전역 단축키(Ctrl/Cmd + K)로 어디서나 빠르게 작업을 추가할 수 있는 모달.
 * Google Calendar 스타일의 심플한 UI로 설계.
 * 
 * 주요 기능:
 * - 자연어 텍스트 입력 및 실시간 파싱
 * - 날짜/시간 선택 (CustomDatePicker)
 * - 우선순위 선택 (high/medium/low/none)
 * - 프로젝트 및 상위 작업 선택 (계층적 작업 추가)
 * - 스마트 포지셔닝 (화면 하단 공간 부족시 위로 열림)
 * 
 * @module QuickAddModal
 */
import React, { useState, useRef, useEffect } from 'react';
import { getParserExamples, parseNaturalLanguage } from '../utils/nlpParser';
import CustomDatePicker from './CustomDatePicker';
import ProjectSelector from './ProjectSelector';
import { RiCalendarLine, RiFlag2Fill } from 'react-icons/ri';
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker.css";
import { ko } from 'date-fns/locale';


// ==================== 헬퍼 함수 ====================

/**
 * ISO 날짜 문자열을 사용자 친화적 형식으로 변환.
 * 
 * @param {string} isoDateString - ISO 8601 형식 날짜 문자열
 * @returns {string|null} 포맷된 날짜 (예: "오늘", "내일", "3월 15일 오후 2시")
 */
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


/**
 * ISO 문자열을 input[type="datetime-local"] 형식으로 변환.
 * 
 * @param {string} isoString - ISO 8601 형식 문자열
 * @returns {string} datetime-local 입력 형식 문자열
 */
const formatDateForInput = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  const hasTime = !(date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0);
  return localDate.toISOString().slice(0, hasTime ? 16 : 10);
};


/**
 * 로컬 날짜 문자열을 ISO 8601 형식으로 변환.
 * 
 * @param {string} localString - 로컬 날짜/시간 문자열
 * @returns {string|null} ISO 8601 형식 문자열
 */
const toISOString = (localString) => {
  if (!localString) return null;
  if (localString.length === 10) {
    const dateWithTime = new Date(localString + 'T00:00:00');
    return dateWithTime.toISOString();
  }
  return new Date(localString).toISOString();
};


/**
 * 빠른 추가 모달 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 모달 닫기 콜백
 * @param {Function} props.onSubmit - 작업 제출 콜백 (text, projectId, parentId)
 * @param {Array} props.projects - 프로젝트 목록
 * @param {string} props.activeProjectId - 현재 활성 프로젝트 ID
 * @returns {JSX.Element|null} 빠른 추가 모달
 */
const QuickAddModal = ({ isOpen, onClose, onSubmit, projects = [], activeProjectId = null }) => {
  const [text, setText] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(activeProjectId);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [error, setError] = useState('');
  const [placeholder, setPlaceholder] = useState('무엇을 해야 하나요?');
  const [parsedData, setParsedData] = useState(null);
  
  /* [추가] 수동 선택 state */
  // manualDueDate 제거 - 텍스트 파싱 결과(parsedData)를 진실의 원천으로 사용
  const [manualPriority, setManualPriority] = useState('none');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  // <!-- [추가] AI 하위 항목 자동 생성 체크박스 기능 추가 -->
  const [generateSubtasksEnabled, setGenerateSubtasksEnabled] = useState(false);
  
  const inputRef = useRef(null);
  const datePickerContainerRef = useRef(null);

  /* [추가] 스마트 포지셔닝: 화면 아래 공간이 부족하면 위로 열림 */
  useEffect(() => {
    if (showDatePicker && datePickerContainerRef.current) {
      const rect = datePickerContainerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const datePickerHeight = 600; // 달력 + 시간 선택 영역 예상 높이 (확장됨)
      
      if (spaceBelow < datePickerHeight) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [showDatePicker]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setText('');
      setError('');
      setParsedData(null);
      setManualPriority('none');
      setSelectedParentId(null); // 초기화
      setShowDatePicker(false);
      setShowTimePicker(false);
      setShowPriorityPicker(false);
      setGenerateSubtasksEnabled(false); // <!-- [추가] 체크박스 초기화 -->
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
    
    // <!-- [수정] AI 하위 항목 생성 체크박스 상태 전달 -->
    onSubmit(trimmedText, selectedProjectId, selectedParentId, generateSubtasksEnabled);
    
    setText('');
    setError('');
    setParsedData(null);
    setManualPriority('none');
    setSelectedParentId(null);
    setGenerateSubtasksEnabled(false); // <!-- [추가] 체크박스 초기화 -->
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
          .replace(/오늘(\s+(오전|오후)\s+\d{1,2}(:\d{2})?시(\s+\d{1,2}분)?)?/g, '')
          .replace(/내일(\s+(오전|오후)\s+\d{1,2}(:\d{2})?시(\s+\d{1,2}분)?)?/g, '')
          .replace(/모레(\s+(오전|오후)\s+\d{1,2}(:\d{2})?시(\s+\d{1,2}분)?)?/g, '')
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
        .replace(/오늘(\s+(오전|오후)\s+\d{1,2}(:\d{2})?시(\s+\d{1,2}분)?)?/g, '')
        .replace(/내일(\s+(오전|오후)\s+\d{1,2}(:\d{2})?시(\s+\d{1,2}분)?)?/g, '')
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
    { value: 'high', label: '높음', color: 'text-red-600', icon: <RiFlag2Fill /> },
    { value: 'medium', label: '보통', color: 'text-orange-600', icon: <RiFlag2Fill /> },
    { value: 'low', label: '낮음', color: 'text-indigo-600', icon: <RiFlag2Fill /> },
    { value: 'none', label: '없음', color: 'text-slate-500', icon: <RiFlag2Fill /> }
  ];

  const currentPriority = priorities.find(p => p.value === (finalPriority || 'none'));

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-start justify-center z-60 p-4 pt-32"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.1)' }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-scaleIn border border-slate-100">
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
                  : 'border-slate-300 focus:ring-indigo-400'
              } text-slate-800 placeholder-slate-400`}
            />
            {error && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>

          {/* 인라인 컨트롤 */}
          <div className="mb-3 flex items-center gap-2 flex-wrap">
              {/* DatePicker 라이브러리 사용 */}
              <div className="relative" ref={datePickerContainerRef}>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`px-3 py-1.5 text-xs border rounded-md transition-all flex items-center gap-1.5 ${
                    showDatePicker 
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-100 text-indigo-700' 
                      : finalDueDate 
                        ? 'text-indigo-600 font-medium bg-indigo-50 border-indigo-200' 
                        : 'border-slate-300 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <RiCalendarLine />
                  {finalDueDate ? formatDueDate(finalDueDate) : '날짜'}
                </button>
                
                {showDatePicker && (
                  <div className={`absolute left-0 z-50 ${openUpwards ? 'bottom-full mb-2' : 'top-full mt-1'}`}>
                    <CustomDatePicker
                      selectedDate={finalDueDate ? new Date(finalDueDate) : null}
                      onChange={(date) => {
                        if (!date) {
                          handleDateClear();
                          return;
                        }
                        const isoDate = toISOString(date);
                        // 텍스트 필드 업데이트 로직 재사용
                        if (isoDate) {
                          const formattedDate = formatDueDate(isoDate);
                          setText(prev => {
                            const withoutDate = prev
                              .replace(/오늘(\s+(오전|오후)\s+\d{1,2}(:\d{2})?시(\s+\d{1,2}분)?)?/g, '')
                              .replace(/내일(\s+(오전|오후)\s+\d{1,2}(:\d{2})?시(\s+\d{1,2}분)?)?/g, '')
                              .replace(/모레(\s+(오전|오후)\s+\d{1,2}(:\d{2})?시(\s+\d{1,2}분)?)?/g, '')
                              .replace(/(이번|다음|지난)\s*주(\s*말)?/g, '')
                              .replace(/(이번|다음|지난)\s*달(\s*말)?/g, '')
                              .replace(/\d{1,2}월\s+\d{1,2}일(\s+(오전|오후)\s+\d{1,2}시(\s+\d{1,2}분)?)?/g, '')
                              .trim();
                            return withoutDate ? `${withoutDate} ${formattedDate}` : formattedDate;
                          });
                        }
                        // 시간 선택 모드가 아니면 닫기
                        if (!showTimePicker) setShowDatePicker(false);
                      }}
                      onClose={() => setShowDatePicker(false)}
                      showTime={showTimePicker}
                      onToggleTime={() => setShowTimePicker(!showTimePicker)}
                    />
                  </div>
                )}
              </div>

            {/* 우선순위 버튼 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPriorityPicker(!showPriorityPicker)}
                className={`px-3 py-1.5 text-xs border rounded-md transition-colors flex items-center gap-1.5 ${
                  showPriorityPicker 
                    ? 'bg-slate-100 border-slate-300' 
                    : 'border-slate-300 hover:bg-slate-50'
                } ${currentPriority.color}`}
              >
                <span>{currentPriority.icon}</span>
                <span>{currentPriority.label}</span>
              </button>

              {showPriorityPicker && (
                <div className="absolute left-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50 animate-scaleIn origin-top-left">
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => {
                        setManualPriority(p.value);
                        setShowPriorityPicker(false);
                        
                        // 텍스트 필드에도 우선순위 추가
                        if (p.value !== 'none') {
                          const priorityText = `#${p.label}`;
                          const withoutPriority = text.replace(/#(높음|보통|낮음|긴급|중요)/g, '').trim();
                          setText(withoutPriority ? `${withoutPriority} ${priorityText}` : priorityText);
                        } else {
                           // 없음 선택 시 태그 제거
                           const withoutPriority = text.replace(/#(높음|보통|낮음|긴급|중요)/g, '').trim();
                           setText(withoutPriority);
                        }
                      }}
                      className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center gap-2 ${
                        (finalPriority || 'none') === p.value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                      }`}
                    >
                      <span className={p.color}>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 프로젝트 선택 */}
          <div className="mb-4">
            <ProjectSelector
              projects={projects}
              selectedProjectId={selectedProjectId}
              selectedParentId={selectedParentId}
              onSelect={(projectId, parentId) => {
                setSelectedProjectId(projectId);
                setSelectedParentId(parentId);
              }}
            />
          </div>

          {/* <!-- [추가] AI 하위 항목 자동 생성 체크박스 --> */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={generateSubtasksEnabled}
                onChange={(e) => setGenerateSubtasksEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                AI로 하위 항목 생성
              </span>
            </label>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!text.trim() || !selectedProjectId}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
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
