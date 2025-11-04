/* [추가] 날짜/시간 선택 컴포넌트 - 마감일 설정용 */
/* HTML5 datetime-local input 사용 */
/* ISO 8601 문자열과 브라우저 로컬 시간 자동 변환 */
import React, { useState } from 'react';

const DateTimePicker = ({ value, onChange, label = "마감일", showTime = true, disabled = false }) => {
  /* ISO 문자열을 datetime-local input 형식으로 변환 */
  /* 타임존 offset을 고려하여 로컬 시간으로 표시 */
  const toLocalDateTimeString = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
  };

  /* datetime-local 형식을 ISO 문자열로 변환 */
  /* 데이터베이스 저장을 위한 표준 형식 */
  const toISOString = (localString) => {
    if (!localString) return null;
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

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        {/* HTML5 날짜/시간 입력 필드 */}
        {/* showTime: true면 datetime-local, false면 date */}
        <input
          type={showTime ? "datetime-local" : "date"}
          value={toLocalDateTimeString(value)}
          onChange={handleChange}
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
        />
        {/* [추가] 날짜 제거 버튼 - 마감일 해제 기능 */}
        {value && (
          <button
            onClick={handleClear}
            disabled={disabled}
            className="px-3 py-2 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
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
