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
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getParserExamples, parseNaturalLanguage } from '../utils/nlpParser';
import CustomDatePicker from './CustomDatePicker';
import ProjectSelector from './ProjectSelector';
import { RiCalendarLine, RiFlag2Fill } from 'react-icons/ri';
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker.css";
import { formatDueDate, replaceDateText, stripDateText, replacePriorityTag } from '../utils/taskTextUtils';


/** 날짜 선택기 예상 높이 (px) - 아래 공간이 이보다 작으면 위로 연다 */
const DATE_PICKER_HEIGHT = 600;

/** 우선순위 선택지 */
const PRIORITIES = [
  { value: 'high', label: '높음', color: 'text-red-600' },
  { value: 'medium', label: '보통', color: 'text-orange-600' },
  { value: 'low', label: '낮음', color: 'text-indigo-600' },
  { value: 'none', label: '없음', color: 'text-slate-500' },
];


/**
 * 빠른 추가 모달 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 모달 닫기 콜백
 * @param {Function} props.onSubmit - 작업 제출 콜백 (text, projectId, parentId, generateSubtasks)
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
  
  // 수동 우선순위 선택 (날짜는 텍스트 파싱 결과를 사용)
  const [manualPriority, setManualPriority] = useState('none');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const [generateSubtasksEnabled, setGenerateSubtasksEnabled] = useState(false);
  
  const inputRef = useRef(null);
  const datePickerContainerRef = useRef(null);

  /** 입력값 초기화 */
  const resetForm = () => {
    setText('');
    setError('');
    setManualPriority('none');
    setSelectedParentId(null);
    setGenerateSubtasksEnabled(false);
  };

  // 스마트 포지셔닝: 화면 아래 공간이 부족하면 위로 열림 (모바일(<640px)은 항상 아래로)
  useEffect(() => {
    if (showDatePicker && datePickerContainerRef.current) {
      if (window.innerWidth < 640) {
        setOpenUpwards(false);
        return;
      }
      const rect = datePickerContainerRef.current.getBoundingClientRect();
      setOpenUpwards(window.innerHeight - rect.bottom < DATE_PICKER_HEIGHT);
    }
  }, [showDatePicker]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      resetForm();
      setShowDatePicker(false);
      setShowTimePicker(false);
      setShowPriorityPicker(false);
      setPlaceholder(getParserExamples('ko'));
      
      if (activeProjectId) {
        setSelectedProjectId(activeProjectId);
      }
    }
  }, [isOpen, activeProjectId]);

  // 입력 텍스트를 실시간 파싱 (날짜/우선순위의 진실의 원천)
  const parsedData = useMemo(() => (text.trim() ? parseNaturalLanguage(text) : null), [text]);

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
    
    onSubmit(trimmedText, selectedProjectId, selectedParentId, generateSubtasksEnabled);
    
    resetForm();
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

  const handleDateSelect = (date) => {
    if (!date) {
      handleDateClear();
      return;
    }
    setText(prev => replaceDateText(prev, date));
    // 시간 선택 모드가 아니면 닫기
    if (!showTimePicker) setShowDatePicker(false);
  };

  const handleDateClear = () => {
    setText(prev => stripDateText(prev));
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const handlePrioritySelect = (priority) => {
    setManualPriority(priority);
    setShowPriorityPicker(false);
    setText(prev => replacePriorityTag(prev, priority));
  };

  const finalDueDate = parsedData?.due_date;
  const finalPriority = manualPriority !== 'none' ? manualPriority : parsedData?.priority;

  const currentPriority = PRIORITIES.find(p => p.value === (finalPriority || 'none'));

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
                      onChange={handleDateSelect}
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
                <RiFlag2Fill />
                <span>{currentPriority.label}</span>
              </button>

              {showPriorityPicker && (
                <div className="absolute left-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50 animate-scaleIn origin-top-left">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handlePrioritySelect(p.value)}
                      className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center gap-2 ${
                        (finalPriority || 'none') === p.value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                      }`}
                    >
                      <RiFlag2Fill className={p.color} />
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
