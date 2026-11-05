/**
 * 온보딩 가이드 컴포넌트
 *
 * 처음 로그인한 사용자에게 핵심 사용법을 단계별로 안내.
 * 열림 상태는 App이 관리하며(최초 1회 자동 표시, 사이드바 '도움말'로 다시 열기),
 * 닫을 때 로컬 스토리지에 'hasSeenOnboarding' 플래그를 저장.
 *
 * @module OnboardingGuide
 */
import React, { useEffect, useState } from 'react';
import { RiArrowRightLine, RiCloseLine } from 'react-icons/ri';

const STEPS = [
  {
    title: 'TaskGenie 사용법',
    description: '키워드 하나로 할 일 목록을 만들고, 끝낸 일을 지워 나가는 도구입니다. 다섯 장이면 다 봅니다.',
  },
  {
    title: '키워드로 프로젝트 만들기',
    description: '사이드바의 ‘새 프로젝트’를 누르고 ‘운동하기’, ‘프로젝트 기획’ 같은 키워드를 적으세요.',
    note: 'AI가 큰 단계와 세부 할 일을 계층으로 나눠 적어 줍니다.',
  },
  {
    title: '항목을 더 잘게 나누기',
    description: '항목 오른쪽 ⋮ 메뉴에서 ‘하위 작업 생성’을 누르면 그 항목만 다시 나눕니다.',
    note: '깊이 제한은 없습니다. 항목을 끌어서 순서도 바꿀 수 있습니다.',
  },
  {
    title: '말하듯 추가하기',
    description: 'Ctrl/⌘ K를 누르고 ‘내일 오후 3시 치과 #긴급’처럼 적으면 날짜와 우선순위를 알아서 읽습니다.',
  },
  {
    title: '진행률은 구조대로',
    description: '하위 항목을 모두 끝내면 상위 항목도 완료됩니다. 진행률은 단계별 비중을 따져 계산합니다.',
    note: '이 안내는 사이드바 아래 ‘도움말’에서 다시 볼 수 있습니다.',
  },
];

/**
 * OnboardingGuide 컴포넌트.
 *
 * @param {Object} props - 컴포넌트 속성
 * @param {boolean} props.isOpen - 표시 여부
 * @param {Function} props.onClose - 닫기(완료/건너뛰기) 콜백
 * @returns {JSX.Element|null} 온보딩 화면 또는 null
 */
const OnboardingGuide = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // 다시 열 때마다 첫 장부터
  useEffect(() => {
    if (isOpen) setCurrentStep(0);
  }, [isOpen]);

  const close = () => {
    try {
      localStorage.setItem('hasSeenOnboarding', 'true');
    } catch {
      /* 저장 불가 환경은 무시 */
    }
    onClose?.();
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-paper p-4 animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="w-full max-w-lg rounded-md border border-rule bg-sheet shadow-sheet"
      >
        {/* 진행 표시: 장 수만큼 칸 */}
        <div className="flex items-center justify-between border-b border-rule px-6 py-3">
          <div className="flex gap-1" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-[3px] w-6 transition-colors ${i <= currentStep ? 'bg-ink' : 'bg-rule'}`}
              />
            ))}
          </div>
          <span className="font-mono text-xs text-ink-3 tabular">
            {String(currentStep + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
          </span>
        </div>

        <div className="px-6 pb-6 pt-8 sm:px-8">
          <h2 id="onboarding-title" className="break-keep font-serif text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
            {step.title}
          </h2>
          <p className="mt-3 break-keep text-[15px] leading-relaxed text-ink-2">{step.description}</p>
          {step.note && (
            <p className="mt-4 break-keep border-l-2 border-rule-strong pl-3 text-sm leading-relaxed text-ink-3">
              {step.note}
            </p>
          )}

          <div className="mt-10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={close}
              className="inline-flex items-center gap-1 whitespace-nowrap text-sm text-ink-3 hover:text-ink"
            >
              <RiCloseLine aria-hidden="true" />
              건너뛰기
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="whitespace-nowrap rounded px-3.5 py-2 text-sm text-ink-2 hover:bg-paper-2"
                >
                  이전
                </button>
              )}
              <button
                type="button"
                onClick={() => (isLast ? close() : setCurrentStep((s) => s + 1))}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-2"
                autoFocus
              >
                {isLast ? '시작하기' : '다음'}
                {!isLast && <RiArrowRightLine aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuide;
