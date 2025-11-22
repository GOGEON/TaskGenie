/* [추가] 클라이언트 사이드 자연어 파싱 (AI 없이 정규식 사용) */
/* [대폭 개선] 요일, 상대적 날짜, 시간 키워드, 반복 작업, 상대적 시간 지원 */
/* [수정] 시간 미지정 시 00:00:00으로 설정 */

/**
 * 자연어 텍스트를 파싱하여 작업 정보 추출
 * AI 호출 없이 정규식으로 빠르게 파싱
 */
export const parseNaturalLanguage = (text) => {
  let description = text;
  let priority = 'none';
  let dueDate = null;
  let recurring = null;
  
  const now = new Date();

  // 1. 우선순위 파싱
  if (/(긴급|중요|!!|🔴|#긴급|#중요)/i.test(text)) {
    priority = 'high';
    description = description.replace(/(긴급|중요|!!|🔴|#긴급|#중요)/gi, '').trim();
  } else if (/(보통|#보통)/i.test(text)) {
    priority = 'medium';
    description = description.replace(/(보통|#보통)/gi, '').trim();
  } else if (/(낮음|#낮음)/i.test(text)) {
    priority = 'low';
    description = description.replace(/(낮음|#낮음)/gi, '').trim();
  }

  // 2. 반복 작업 파싱
  if (/매일/i.test(text)) {
    recurring = 'daily';
    description = description.replace(/매일/gi, '').trim();
  } else if (/매주/i.test(text)) {
    recurring = 'weekly';
    description = description.replace(/매주/gi, '').trim();
  } else if (/(매달|매월)/i.test(text)) {
    recurring = 'monthly';
    description = description.replace(/(매달|매월)/gi, '').trim();
  }

  // 3. 상대적 시간 파싱 (X시간 후, X분 후) - 가장 먼저 처리
  const relativeHourMatch = text.match(/(\d+)\s*시간\s*(후|뒤)/i);
  const relativeMinuteMatch = text.match(/(\d+)\s*분\s*(후|뒤)/i);
  
  if (relativeHourMatch || relativeMinuteMatch) {
    dueDate = new Date(now);
    
    if (relativeHourMatch) {
      const hours = parseInt(relativeHourMatch[1]);
      dueDate.setHours(dueDate.getHours() + hours);
      description = description.replace(/\d+\s*시간\s*(후|뒤)/gi, '').trim();
    }
    
    if (relativeMinuteMatch) {
      const minutes = parseInt(relativeMinuteMatch[1]);
      dueDate.setMinutes(dueDate.getMinutes() + minutes);
      description = description.replace(/\d+\s*분\s*(후|뒤)/gi, '').trim();
    }
    
    // 30분 단위로 올림
    const mins = dueDate.getMinutes();
    if (mins > 0 && mins <= 30) {
      dueDate.setMinutes(30, 0, 0);
    } else if (mins > 30) {
      dueDate.setMinutes(0, 0, 0);
      dueDate.setHours(dueDate.getHours() + 1);
    } else {
      dueDate.setSeconds(0, 0);
    }
  }

  // 3-1. 확장된 상대적 날짜 (달, 년)
  const relativeMonthMatch = text.match(/(\d+)\s*(달|개월)\s*(후|뒤)/i);
  const relativeYearMatch = text.match(/(\d+)\s*년\s*(후|뒤)/i);

  if (relativeMonthMatch && !dueDate) {
    const months = parseInt(relativeMonthMatch[1]);
    dueDate = new Date(now.getFullYear(), now.getMonth() + months, now.getDate(), 0, 0, 0);
    description = description.replace(/\d+\s*(달|개월)\s*(후|뒤)/gi, '').trim();
  }

  if (relativeYearMatch && !dueDate) {
    const years = parseInt(relativeYearMatch[1]);
    dueDate = new Date(now.getFullYear() + years, now.getMonth(), now.getDate(), 0, 0, 0);
    description = description.replace(/\d+\s*년\s*(후|뒤)/gi, '').trim();
  }

  // 4. 명시적 날짜 파싱 (YYYY년 MM월 DD일 또는 MM월 DD일)
  const explicitDateMatch = text.match(/(\d{4}년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
  if (explicitDateMatch && !dueDate) {
    const year = explicitDateMatch[1] ? parseInt(explicitDateMatch[1]) : now.getFullYear();
    const month = parseInt(explicitDateMatch[2]) - 1; // 월은 0부터 시작
    const day = parseInt(explicitDateMatch[3]);
    
    // 만약 연도가 없고, 입력된 날짜가 오늘 이전이라면 내년으로 설정 (선택 사항, Todoist 방식)
    let targetDate = new Date(year, month, day, 0, 0, 0);
    if (!explicitDateMatch[1] && targetDate < now) {
      targetDate.setFullYear(year + 1);
    }
    
    dueDate = targetDate;
    description = description.replace(/(\d{4}년\s*)?\d{1,2}월\s*\d{1,2}일/gi, '').trim();
  }

  // 4-0. 월만 입력된 경우 (예: "12월") -> 1일로 설정
  const monthOnlyMatch = text.match(/(\d{1,2})월(?!(\s*\d{1,2}일))/);
  if (monthOnlyMatch && !dueDate) {
    const month = parseInt(monthOnlyMatch[1]) - 1;
    const year = now.getFullYear();
    
    let targetDate = new Date(year, month, 1, 0, 0, 0);
    // 만약 입력된 월이 이번 달보다 이전이라면 내년으로 설정
    if (targetDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
      targetDate.setFullYear(year + 1);
    }
    
    dueDate = targetDate;
    description = description.replace(/\d{1,2}월/gi, '').trim();
  }

  // 4-1. X일 후/뒤 파싱
  const daysLaterMatch = text.match(/(\d+)\s*일\s*(후|뒤)/i);
  if (daysLaterMatch && !dueDate) {
    const days = parseInt(daysLaterMatch[1]);
    dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days, 0, 0, 0);
    description = description.replace(/\d+\s*일\s*(후|뒤)/gi, '').trim();
  }

  // 5. 기본 날짜 및 특수 표현 파싱
  if (!dueDate) {
    if (/(오늘\s*중에|나중에)/i.test(text)) {
      // "오늘 중에", "나중에" -> 오늘 자정 (시간 미지정)
      dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      description = description.replace(/(오늘\s*중에|나중에)/gi, '').trim();
    } else if (/오늘(까지)?/i.test(text)) {
      dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      description = description.replace(/오늘(까지)?/gi, '').trim();
    } else if (/내일(까지)?/i.test(text)) {
      // 내일 00:00:00 (시간 없음)
      dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      description = description.replace(/내일(까지)?/gi, '').trim();
    } else if (/모레(까지)?/i.test(text)) {
      dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 0, 0);
      description = description.replace(/모레(까지)?/gi, '').trim();
    } else if (/다음\s*주(까지)?/i.test(text)) {
      dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 0, 0, 0);
      description = description.replace(/다음\s*주(까지)?/gi, '').trim();
    } else if (/어제/i.test(text)) {
      dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      description = description.replace(/어제/gi, '').trim();
    } else if (/지난\s*주/i.test(text)) {
      dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0);
      description = description.replace(/지난\s*주/gi, '').trim();
    }
  }

  // 6. 요일 파싱
  const weekdays = {
    '월요일': 1, '월': 1,
    '화요일': 2, '화': 2,
    '수요일': 3, '수': 3,
    '목요일': 4, '목': 4,
    '금요일': 5, '금': 5,
    '토요일': 6, '토': 6,
    '일요일': 0, '일': 0
  };

  let weekdayMatch = null;
  let weekdayModifier = '';
  
  // "다음 월요일", "이번 주 금요일" 등의 패턴 찾기
  for (const [dayName, dayNum] of Object.entries(weekdays)) {
    const pattern = new RegExp(`(다음|이번\\s*주)?\\s*(${dayName})(까지)?`, 'i');
    const match = text.match(pattern);
    if (match) {
      weekdayMatch = { dayName, dayNum };
      weekdayModifier = match[1] || '';
      description = description.replace(pattern, '').trim();
      break;
    }
  }

  if (weekdayMatch && !dueDate) {
    const targetDay = weekdayMatch.dayNum;
    const currentDay = now.getDay();
    let daysUntil = targetDay - currentDay;
    
    // "다음"이 명시되어 있거나, 오늘과 같은 요일이면 다음 주로
    if (weekdayModifier.includes('다음') || daysUntil <= 0) {
      daysUntil += 7;
    }
    
    dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntil, 0, 0, 0);
  }

  // 7. 주말 파싱
  if (/이번\s*주말/i.test(text) && !dueDate) {
    const currentDay = now.getDay();
    const daysUntilSaturday = (6 - currentDay + 7) % 7 || 7;
    dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSaturday, 0, 0, 0);
    description = description.replace(/이번\s*주말/gi, '').trim();
  } else if (/다음\s*주말/i.test(text) && !dueDate) {
    const currentDay = now.getDay();
    const daysUntilNextSaturday = ((6 - currentDay + 7) % 7 || 7) + 7;
    dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilNextSaturday, 0, 0, 0);
    description = description.replace(/다음\s*주말/gi, '').trim();
  }

  // 8. 다음 달 파싱
  if (/다음\s*달/i.test(text) && !dueDate) {
    dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    description = description.replace(/다음\s*달/gi, '').trim();
  }

  // 9. 이번 달 말 파싱
  if (/이번\s*달\s*말/i.test(text) && !dueDate) {
    dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 0, 0, 0);
    description = description.replace(/이번\s*달\s*말/gi, '').trim();
  }

  // 10. 시간 키워드 파싱
  const timeKeywords = {
    '새벽': 5,
    '아침': 8,
    '오전': 10,
    '점심': 12, '점심시간': 12, '점심 시간': 12, '정오': 12,
    '오후': 14,
    '저녁': 18,
    '밤': 21,
    '심야': 23
  };

  let timeKeywordMatched = false;
  for (const [keyword, hour] of Object.entries(timeKeywords)) {
    // 한글은 단어 경계가 작동하지 않으므로 includes 사용
    if (description.includes(keyword)) {
      if (!dueDate) {
        dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
      } else if (dueDate.getHours() === 0) {
        // 날짜만 설정된 경우 시간 추가
        dueDate.setHours(hour, 0, 0);
      }
      description = description.replace(new RegExp(keyword, 'g'), '').trim();
      timeKeywordMatched = true;
      break;
    }
  }

  // 11. 시간 파싱 (예: "오후 3시", "15시", "3시")
  const timeMatch = text.match(/(오전|오후)?\s*(\d{1,2})\s*시/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[2]);
    if (timeMatch[1] === '오후' && hour < 12) {
      hour += 12;
    } else if (timeMatch[1] === '오전' && hour === 12) {
      hour = 0;
    }
    
    if (!dueDate) {
      dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
    } else {
      dueDate.setHours(hour, 0, 0);
    }
    description = description.replace(/(오전|오후)?\s*\d{1,2}\s*시/gi, '').trim();
  }

  // 12. 분 파싱 (예: "30분")
  const minuteMatch = text.match(/(\d{1,2})\s*분/);
  if (minuteMatch && dueDate) {
    const minute = parseInt(minuteMatch[1]);
    dueDate.setMinutes(minute);
    description = description.replace(/\d{1,2}\s*분/gi, '').trim();
  }

  // ISO 형식으로 변환 (로컬 시간 유지)
  let dueDateISO = null;
  if (dueDate) {
    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
    const day = String(dueDate.getDate()).padStart(2, '0');
    const hours = String(dueDate.getHours()).padStart(2, '0');
    const minutes = String(dueDate.getMinutes()).padStart(2, '0');
    const seconds = String(dueDate.getSeconds()).padStart(2, '0');
    
    // KST 시간대로 ISO 문자열 생성
    dueDateISO = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`;
  }

  // "까지" 제거 및 여러 공백을 하나로 정리
  description = description.replace(/까지/g, '').replace(/\s+/g, ' ').trim();

  const result = {
    description,
    priority,
    due_date: dueDateISO
  };

  // 반복 작업 메타데이터 추가 (있는 경우만)
  if (recurring) {
    result.recurring = recurring;
  }

  return result;
};

/**
 * 자연어 파싱 예시 목록 반환
 * @param {string} lang - 언어 코드 ('ko' 또는 'en')
 * @returns {string} 랜덤 예시 문구
 */
export const getParserExamples = (lang = 'ko') => {
  const examples = {
    ko: [
      '내일 오후 3시 보고서 작성',
      '매주 월요일 아침 9시 팀 회의',
      '이번 주 금요일까지 프로젝트 완료',
      '오늘 저녁 7시 친구와 약속',
      '11월 25일 점심 식사 예약',
      '매일 아침 7시 운동',
      '3일 후 오후 2시 치과 예약',
      '다음 주 월요일까지 자료 조사',
      '내일 정오 점심 약속',
      '오늘 밤 9시 영화 보기',
      '매달 1일 관리비 납부',
      '오후 2시 미팅',
      '내일 새벽 5시 기상'
    ],
    en: [
      'Meeting tomorrow at 3pm',
      'Team meeting every Monday at 9am',
      'Finish project by this Friday',
      'Dinner with friends today at 7pm',
      'Lunch reservation on Nov 25',
      'Workout every day at 7am',
      'Dentist appointment in 3 days at 2pm',
      'Research by next Monday',
      'Lunch at noon tomorrow',
      'Watch movie tonight at 9pm'
    ]
  };

  const list = examples[lang] || examples['ko'];
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
};
