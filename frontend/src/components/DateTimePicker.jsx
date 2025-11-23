/* [추가] 날짜/시간 선택 컴포넌트 - 마감일 설정용 */
/* HTML5 date 또는 datetime-local input 사용 */
/* ISO 8601 문자열과 브라우저 로컬 시간 자동 변환 */
import React, { useState } from 'react';

/* [수정] 시간 입력을 선택 사항으로 변경 - 토글 버튼으로 시간 추가/제거 가능 */
const DateTimePicker = ({ value, onChange, label = "마감일", showTime: showTimeProp, disabled = false }) => {
  // showTime이 prop으로 제공되지 않으면 현재 값에 시간이 있는지 확인
  const hasTimeInValue = value ? (() => {
    const date = new Date(value);
    return !(date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0);
  })() : false;
  
  const [showTime, setShowTime] = useState(showTimeProp !== undefined ? showTimeProp : hasTimeInValue);

  /* ISO 문자열을 input 형식으로 변환 (날짜 전용 또는 날짜+시간) */
  /* 타임존 offset을 고려하여 로컬 시간으로 표시 */
  const toLocalDateTimeString = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    // showTime이 false면 날짜만 (YYYY-MM-DD), true면 날짜+시간 (YYYY-MM-DDTHH:mm)
    return localDate.toISOString().slice(0, showTime ? 16 : 10);
  };

  /* datetime-local 또는 date 형식을 ISO 문자열로 변환 */
  /* 데이터베이스 저장을 위한 표준 형식 */
  /* [수정] 날짜만 입력 시 시간을 00:00:00으로 설정 (시간 미지정 표시) */
  const toISOString = (localString) => {
    if (!localString) return null;
    
    // 날짜만 입력된 경우 (YYYY-MM-DD 형식)
    if (localString.length === 10) {
      // 00:00:00으로 설정 (ToDoItem에서 시간 미지정으로 인식)
      const dateWithTime = new Date(localString + 'T00:00:00');
      return dateWithTime.toISOString();
    }
    
    // 날짜+시간이 모두 있는 경우
    return new Date(localString).toISOString();
  };

  /* 날짜 변경 핸들러 - 로컬 → ISO 변환 후 부모에 전달 */
  const handleChange = (e) => {
    const localValue = e.target.value;
    onChange(toISOString(localValue));
  };

  /* 날짜 제거 핸들러 - null 전달 */
  const handleClear = () => {
    onChange(null);
  };
  
  /* [추가] 시간 토글 핸들러 - 시간 추가/제거 */
  const handleTimeToggle = () => {
    const newShowTime = !showTime;
    setShowTime(newShowTime);
    
    // 값이 있을 때만 변환 처리
    if (value) {
      const date = new Date(value);
      if (!newShowTime) {
        // 시간 제거: 00:00:00으로 설정
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const newDate = new Date(`${year}-${month}-${day}T00:00:00`);
        onChange(newDate.toISOString());
      }
      // 시간 추가하는 경우는 기존 값 유지
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {/* [추가] 시간 추가/제거 토글 버튼 */}
        {showTimeProp === undefined && (
          <button
            type="button"
            onClick={handleTimeToggle}
            disabled={disabled}
            className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showTime ? '⏰ 시간 제거' : '⏰ 시간 추가'}
          </button>
        )}
      </div>
      <div className="flex gap-2">
        {/* HTML5 날짜/시간 입력 필드 */}
        {/* showTime: true면 datetime-local, false면 date */}
        <input
          type={showTime ? "datetime-local" : "date"}
          value={toLocalDateTimeString(value)}
          onChange={handleChange}
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100 disabled:cursor-not-allowed text-sm text-slate-700"
        />
        {/* [추가] 날짜 제거 버튼 - 마감일 해제 기능 */}
        {value && (
          <button
            onClick={handleClear}
            disabled={disabled}
            className="px-3 py-2 text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"
            title="날짜 제거"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default DateTimePicker;
