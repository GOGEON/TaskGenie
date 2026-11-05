import { describe, it, expect } from 'vitest';
import {
  formatDueDate,
  stripDateText,
  replaceDateText,
  replacePriorityTag,
} from '../src/utils/taskTextUtils';

const NOW = new Date(2026, 2, 10, 9, 0); // 2026-03-10 09:00 (로컬)

describe('formatDueDate', () => {
  it('formats today/tomorrow and other dates', () => {
    expect(formatDueDate(new Date(2026, 2, 10).toISOString(), NOW)).toBe('오늘');
    expect(formatDueDate(new Date(2026, 2, 11).toISOString(), NOW)).toBe('내일');
    expect(formatDueDate(new Date(2026, 2, 15).toISOString(), NOW)).toBe('3월 15일');
  });

  it('appends time when not midnight', () => {
    expect(formatDueDate(new Date(2026, 2, 15, 14, 30).toISOString(), NOW)).toBe('3월 15일 오후 2시 30분');
    expect(formatDueDate(new Date(2026, 2, 15, 0, 5).toISOString(), NOW)).toBe('3월 15일 오전 12시 5분');
  });

  it('returns null for empty input', () => {
    expect(formatDueDate(null)).toBeNull();
  });
});

describe('stripDateText', () => {
  it('removes relative and absolute date expressions', () => {
    expect(stripDateText('보고서 작성 내일 오후 3시')).toBe('보고서 작성');
    expect(stripDateText('회의 다음주 준비')).toBe('회의 준비');
    expect(stripDateText('3월 15일 오전 9시 30분 운동')).toBe('운동');
    expect(stripDateText('이번 달 말 정산')).toBe('정산');
  });
});

describe('replaceDateText', () => {
  it('replaces an existing date with the new one', () => {
    const result = replaceDateText('보고서 오늘', new Date(2030, 0, 5));
    expect(result).toBe('보고서 1월 5일');
  });
});

describe('replacePriorityTag', () => {
  it('replaces or removes priority tags', () => {
    expect(replacePriorityTag('보고서 #낮음', 'high')).toBe('보고서 #높음');
    expect(replacePriorityTag('보고서 #긴급', 'none')).toBe('보고서');
    expect(replacePriorityTag('', 'medium')).toBe('#보통');
  });
});
