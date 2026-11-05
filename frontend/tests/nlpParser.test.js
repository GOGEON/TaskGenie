import { describe, it, expect } from 'vitest';
import { parseNaturalLanguage } from '../src/utils/nlpParser';

describe('parseNaturalLanguage priority', () => {
  it.each([
    ['보고서 작성 #높음', 'high'],
    ['보고서 작성 높음', 'high'],
    ['보고서 작성 긴급', 'high'],
    ['보고서 작성 !!', 'high'],
    ['보고서 작성 #보통', 'medium'],
    ['보고서 작성 #낮음', 'low'],
    ['보고서 작성', 'none'],
  ])('%s → %s', (text, expected) => {
    const result = parseNaturalLanguage(text);
    expect(result.priority).toBe(expected);
    expect(result.description).toBe('보고서 작성');
  });

  it('parses date/time together with priority tag', () => {
    const result = parseNaturalLanguage('보고서 작성 내일 오후 3시 #높음');
    expect(result.priority).toBe('high');
    expect(result.description).toBe('보고서 작성');
    // 파서는 로컬 날짜/시각에 KST 오프셋을 붙여 반환한다
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = String(tomorrow.getDate()).padStart(2, '0');
    expect(result.due_date).toMatch(new RegExp(`-${day}T15:00:00\\+09:00$`));
  });
});
