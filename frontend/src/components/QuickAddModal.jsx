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
import { RiCalendarLine, RiFlag2Fill, RiFlag2Line } from 'react-icons/ri';
import "react-datepicker/dist/react-datepicker.css";
import "../datepicker.css";
import { formatDueDate, replaceDateText, stripDateText, replacePriorityTag } from '../utils/taskTextUtils';


/** 날짜 선택기 예상 높이 (px) - 아래 공간이 이보다 작으면 위로 연다 */
const DATE_PICKER_HEIGHT = 600;

/** 우선순위 선택지 */
const PRIORITIES = [
  { value: 'high', label: '높음', color: 'text-accent-ink', icon: <RiFlag2Fill /> },
  { value: 'medium', label: '보통', color: 'text-ochre', icon: <RiFlag2Fill /> },
  { value: 'low', label: '낮음', color: 'text-blueink', icon: <RiFlag2Fill /> },
  { value: 'none', label: '없음', color: 'text-ink-3', icon: <RiFlag2Line /> },
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

  const chipBase = 'inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-xs transition-colors';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/30 p-3 pt-[10vh] animate-fade-in sm:p-4 sm:pt-[14vh]"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="할 일 추가"
        className="w-full max-w-lg rounded-md border border-rule bg-sheet shadow-pop animate-pop-in"
      >
        <form onSubmit={handleSubmit}>
          {/* 입력 — 문장으로 적으면 날짜/우선순위를 읽음 */}
          <div className="border-b border-rule px-4 pb-3 pt-4">
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
              aria-label="할 일 내용"
              aria-invalid={Boolean(error)}
              className="w-full bg-transparent text-base text-ink focus:outline-none"
            />
            {error ? (
              <p className="mt-1.5 text-xs text-accent-ink">{error}</p>
            ) : (
              <p className="mt-1.5 text-xs text-ink-4">‘내일 오후 3시’, ‘#긴급’ 같은 말을 넣으면 알아서 읽습니다.</p>
            )}
          </div>

          <div className="space-y-3 px-4 py-3">
            {/* 날짜 / 우선순위 */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative" ref={datePickerContainerRef}>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`${chipBase} ${
                    showDatePicker
                      ? 'border-ink bg-paper text-ink'
                      : finalDueDate
                        ? 'border-ink-3 bg-paper font-medium text-ink'
                        : 'border-rule text-ink-2 hover:border-ink-3'
                  }`}
                  aria-expanded={showDatePicker}
                >
                  <RiCalendarLine aria-hidden="true" />
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

              {/* 우선순위 */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPriorityPicker(!showPriorityPicker)}
                  className={`${chipBase} ${
                    showPriorityPicker ? 'border-ink bg-paper' : 'border-rule hover:border-ink-3'
                  } ${currentPriority.color}`}
                  aria-expanded={showPriorityPicker}
                >
                  <span aria-hidden="true">{currentPriority.icon}</span>
                  <span>{currentPriority.value === 'none' ? '우선순위' : currentPriority.label}</span>
                </button>

                {showPriorityPicker && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-32 rounded-md border border-rule bg-sheet py-1 shadow-pop animate-pop-in">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => handlePrioritySelect(p.value)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-paper-2 ${
                          (finalPriority || 'none') === p.value ? 'font-semibold text-ink' : 'text-ink-2'
                        }`}
                      >
                        <span className={p.color} aria-hidden="true">{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 프로젝트 / 상위 작업 */}
            <ProjectSelector
              projects={projects}
              selectedProjectId={selectedProjectId}
              selectedParentId={selectedParentId}
              onSelect={(projectId, parentId) => {
                setSelectedProjectId(projectId);
                setSelectedParentId(parentId);
              }}
            />

            {/* AI 하위 항목 자동 생성 */}
            <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-ink-2 hover:text-ink">
              <input
                type="checkbox"
                checked={generateSubtasksEnabled}
                onChange={(e) => setGenerateSubtasksEnabled(e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded-sm accent-[var(--color-ink)]"
              />
              추가하면서 AI로 하위 항목도 만들기
            </label>
          </div>

          {/* 하단 */}
          <div className="flex items-center justify-between gap-2 border-t border-rule px-4 py-3">
            <p className="hidden font-mono text-[11px] text-ink-3 sm:block">Enter 추가 · Esc 닫기</p>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded px-3.5 py-2 text-sm text-ink-2 transition-colors hover:bg-paper-2"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!text.trim() || !selectedProjectId}
                className="rounded bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink-2 disabled:bg-ink-4"
              >
                추가
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddModal;
