/**
 * 워드마크 컴포넌트
 *
 * 로고 마크(목록 세 줄 중 마지막 줄을 빨간 줄로 지운 모양) + 세리프 로고타입.
 *
 * @module Wordmark
 */
import React from 'react';

export const LogoMark = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect width="32" height="32" rx="6" fill="var(--color-ink)" />
    <rect x="7" y="9" width="12" height="2" rx="1" fill="var(--color-paper)" />
    <rect x="7" y="15" width="18" height="2" rx="1" fill="var(--color-paper)" />
    <rect x="7" y="21" width="9" height="2" rx="1" fill="var(--color-paper)" opacity="0.45" />
    <path d="M5.5 22 L26 22" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const Wordmark = ({ size = 'md', className = '' }) => {
  const markSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';
  const textSize = size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={markSize} />
      <span className={`font-serif font-semibold tracking-tight text-ink ${textSize}`}>TaskGenie</span>
    </span>
  );
};

export default Wordmark;
