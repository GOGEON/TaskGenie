/**
 * 빠른 추가 입력 텍스트 유틸리티
 *
 * 날짜/우선순위를 버튼으로 선택했을 때 입력 텍스트에 자연어 표현을 넣거나 빼는 데 사용.
 * 텍스트가 진실의 원천이며, 파싱은 nlpParser가 담당한다.
 *
 * @module taskTextUtils
 */

/** "오전 3시", "오후 2:30시", "오후 2시 30분" 같은 시간 표현 (선택) */
const TIME_SUFFIX = String.raw`(\s+(오전|오후)\s+\d{1,2}(:\d{2})?시(\s+\d{1,2}분)?)?`;

/** 텍스트에서 제거할 날짜 표현 패턴 */
const DATE_PATTERNS = [
  new RegExp(`(오늘|내일|모레)${TIME_SUFFIX}`, 'g'),
  /(이번|다음|지난)\s*(주|달)(\s*말)?/g,
  new RegExp(String.raw`\d{1,2}월\s+\d{1,2}일${TIME_SUFFIX}`, 'g'),
];

/** 우선순위 태그 (#높음 등) */
const PRIORITY_TAG = /#(높음|보통|낮음|긴급|중요)/g;

/** 우선순위 값 → 텍스트 태그 라벨 */
const PRIORITY_LABELS = { high: '높음', medium: '보통', low: '낮음' };

/** 연속 공백 정리 */
const tidy = (text) => text.replace(/\s{2,}/g, ' ').trim();

/** 텍스트 끝에 토큰 추가 */
const append = (text, token) => (text ? `${text} ${token}` : token);

/**
 * ISO 날짜 문자열을 사용자 친화적 형식으로 변환.
 *
 * @param {string} isoDateString - ISO 8601 형식 날짜 문자열
 * @param {Date} [now] - 기준 시각 (테스트용)
 * @returns {string|null} 포맷된 날짜 (예: "오늘", "내일", "3월 15일 오후 2시")
 */
export const formatDueDate = (isoDateString, now = new Date()) => {
  if (!isoDateString) return null;

  const date = new Date(isoDateString);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let dateStr;
  if (date.toDateString() === now.toDateString()) {
    dateStr = '오늘';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    dateStr = '내일';
  } else {
    dateStr = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }

  // 시간 부분 (00:00이 아닐 때만 표시)
  const hours = date.getHours();
  const minutes = date.getMinutes();
  if (hours !== 0 || minutes !== 0) {
    const period = hours < 12 ? '오전' : '오후';
    const displayMinutes = minutes > 0 ? ` ${minutes}분` : '';
    dateStr += ` ${period} ${hours % 12 || 12}시${displayMinutes}`;
  }

  return dateStr;
};

/**
 * 텍스트에서 날짜 표현 제거.
 *
 * @param {string} text - 입력 텍스트
 * @returns {string} 날짜 표현이 제거된 텍스트
 */
export const stripDateText = (text) =>
  tidy(DATE_PATTERNS.reduce((acc, pattern) => acc.replace(pattern, ''), text));

/**
 * 텍스트의 날짜 표현을 주어진 날짜로 교체.
 *
 * @param {string} text - 입력 텍스트
 * @param {Date|string} date - 새 날짜
 * @returns {string} 날짜가 교체된 텍스트
 */
export const replaceDateText = (text, date) =>
  append(stripDateText(text), formatDueDate(new Date(date).toISOString()));

/**
 * 텍스트의 우선순위 태그를 주어진 우선순위로 교체 ('none'이면 제거만).
 *
 * @param {string} text - 입력 텍스트
 * @param {string} priority - high | medium | low | none
 * @returns {string} 우선순위 태그가 교체된 텍스트
 */
export const replacePriorityTag = (text, priority) => {
  const withoutTag = tidy(text.replace(PRIORITY_TAG, ''));
  const label = PRIORITY_LABELS[priority];
  return label ? append(withoutTag, `#${label}`) : withoutTag;
};
