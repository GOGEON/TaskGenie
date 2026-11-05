/**
 * 랜딩 페이지
 *
 * 로그인하지 않은 사용자가 처음 보는 화면.
 * 추상적인 아이콘·문구 대신 실제 제품이 만들어 내는 목록을 그대로 보여 준다.
 *
 * @module LandingPage
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { RiArrowRightUpLine, RiCheckLine } from 'react-icons/ri';
import Wordmark from '../components/Wordmark';

const PRIORITY_BORDER = {
  high: 'border-accent',
  medium: 'border-ochre',
  low: 'border-blueink',
  none: 'border-ink-4',
};

/** 예시 목록 — 실제 생성 결과와 같은 구조(계층/마감일/우선순위) */
const buildSpecimen = () => {
  const today = new Date();
  const d = (n) => format(addDays(today, n), 'M.d');
  return [
    { id: 'a', text: '이사 날짜 확정하기', done: true },
    {
      id: 'b',
      text: '이사 업체 견적 비교',
      due: d(3),
      soon: true,
      priority: 'high',
      children: [
        { id: 'b1', text: '업체 세 곳에 견적 요청', done: true },
        { id: 'b2', text: '포장 이사 범위 확인' },
      ],
    },
    {
      id: 'c',
      text: '짐 줄이기',
      children: [
        { id: 'c1', text: '안 쓰는 가구 나눔 올리기' },
        { id: 'c2', text: '책 정리해서 중고로 팔기' },
      ],
    },
    { id: 'd', text: '전입 신고, 주소 변경', due: d(16), priority: 'medium' },
    { id: 'e', text: '인터넷·도시가스 이전 신청', priority: 'low' },
  ];
};

const flatten = (items) => items.flatMap((i) => [i, ...(i.children ? flatten(i.children) : [])]);

/** 예시 체크박스 — 대시보드의 체크박스와 같은 모양 */
const SpecimenCheck = ({ checked, priority = 'none' }) => (
  <span
    className={`mt-[3px] flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-colors ${
      checked ? 'border-ink-3 bg-ink-3 text-paper' : `${PRIORITY_BORDER[priority]} bg-sheet text-transparent`
    }`}
  >
    <RiCheckLine className="h-3.5 w-3.5" />
  </span>
);

const SpecimenRow = ({ item, depth, done, onToggle }) => (
  <li>
    <button
      type="button"
      onClick={() => onToggle(item.id)}
      className="flex w-full items-start gap-3 border-b border-rule/70 py-2.5 pr-1 text-left hover:bg-paper/60"
      style={{ paddingLeft: depth * 28 }}
      aria-pressed={done}
    >
      <SpecimenCheck checked={done} priority={item.priority} />
      <span className={`flex-1 text-[15px] leading-6 ${done ? 'strike-pen text-ink-4' : 'text-ink'}`}>
        {item.text}
      </span>
      {item.due && (
        <span
          className={`mt-[2px] rounded-sm px-1.5 py-0.5 font-mono text-[11px] tabular ${
            done ? 'text-ink-4' : item.soon ? 'bg-ochre-wash text-ochre' : 'bg-paper-2 text-ink-3'
          }`}
        >
          {item.due}
        </span>
      )}
    </button>
  </li>
);

const ListSpecimen = () => {
  const specimen = useMemo(buildSpecimen, []);
  const all = useMemo(() => flatten(specimen), [specimen]);
  const [doneIds, setDoneIds] = useState(() => new Set(all.filter((i) => i.done).map((i) => i.id)));

  const toggle = (id) =>
    setDoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderItems = (items, depth = 0) =>
    items.map((item) => (
      <React.Fragment key={item.id}>
        <SpecimenRow item={item} depth={depth} done={doneIds.has(item.id)} onToggle={toggle} />
        {item.children && renderItems(item.children, depth + 1)}
      </React.Fragment>
    ));

  const progress = Math.round((doneIds.size / all.length) * 100);

  return (
    <figure className="w-full">
      <div className="rounded-md border border-rule bg-sheet shadow-sheet">
        {/* 입력 */}
        <div className="flex items-center gap-3 border-b border-rule px-4 py-3 sm:px-5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">키워드</span>
          <span className="text-[15px] text-ink">
            이사 준비
            <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-accent" aria-hidden="true" />
          </span>
        </div>

        <div className="px-4 pb-2 pt-5 sm:px-5">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-serif text-2xl font-semibold tracking-tight text-ink">이사 준비</p>
            <p className="font-mono text-xs text-ink-3 tabular">
              {doneIds.size}/{all.length} · {progress}%
            </p>
          </div>
          <div className="mt-3 h-[3px] w-full bg-rule">
            <div className="h-full bg-ink transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
          <ul className="mt-2">{renderItems(specimen)}</ul>
        </div>
      </div>
      <figcaption className="mt-3 font-mono text-xs text-ink-3">예시 화면입니다. 항목을 눌러 체크해 보세요.</figcaption>
    </figure>
  );
};

const STEPS = [
  {
    title: '키워드로 프로젝트 만들기',
    body: '‘제주도 여행’, ‘기말고사’처럼 한 단어면 됩니다. 큰 단계부터 세부 할 일까지 계층을 나눠 적어 둡니다.',
  },
  {
    title: '막히는 항목은 더 잘게',
    body: '어떤 항목이든 ‘하위 작업 생성’을 누르면 그 항목만 다시 나눕니다. 깊이 제한은 없고, 순서는 끌어서 바꿉니다.',
  },
  {
    title: '말하듯 추가하기',
    body: 'Ctrl/⌘ K를 누르고 문장으로 적으면 날짜와 우선순위를 알아서 읽습니다.',
    demo: true,
  },
  {
    title: '진행률은 구조대로',
    body: '하위 항목을 모두 끝내면 상위 항목도 자동으로 완료됩니다. 진행률은 단계별 비중을 따져 계산합니다.',
  },
];

const ParseDemo = () => (
  <div className="mt-4 rounded-md border border-rule bg-sheet">
    <div className="border-b border-rule px-3 py-2.5 text-sm text-ink">
      내일 오후 3시 치과 예약 <span className="text-accent-ink">#긴급</span>
    </div>
    <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-xs">
      <span className="text-ink">치과 예약</span>
      <span className="text-ink-4">·</span>
      <span className="rounded-sm bg-paper-2 px-1.5 py-0.5 font-mono text-ink-2">내일 15:00</span>
      <span className="rounded-sm bg-accent-wash px-1.5 py-0.5 font-mono text-accent-ink">높음</span>
    </div>
  </div>
);

function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* 상단 바 */}
      <header className="border-b border-rule">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="TaskGenie 홈">
            <Wordmark />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link to="/auth" className="rounded px-3 py-2 text-sm text-ink-2 hover:text-ink">
              로그인
            </Link>
            <Link
              to="/auth?mode=register"
              className="rounded bg-ink px-3.5 py-2 text-sm font-medium text-paper hover:bg-ink-2"
            >
              시작하기
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* 히어로 */}
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-12 lg:gap-16 lg:pt-24">
          <div className="lg:col-span-6 lg:pt-6">
            <h1 className="break-keep font-serif text-[2.6rem] font-semibold leading-[1.15] tracking-tight sm:text-6xl">
              한 줄을 적으면,
              <br />
              <span className="bg-[linear-gradient(transparent_62%,var(--color-highlight)_62%,var(--color-highlight)_92%,transparent_92%)]">
                할 일 목록
              </span>
              이 됩니다.
            </h1>
            <p className="mt-6 max-w-md break-keep text-[17px] leading-relaxed text-ink-2">
              ‘이사 준비’처럼 해야 할 일을 적으면 TaskGenie가 단계별 할 일로 나눠 적어 둡니다. 너무 큰 항목은 한 번
              더 쪼개고, 끝낸 일은 줄을 그어 지워 나가세요.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                to="/auth?mode=register"
                className="rounded bg-ink px-5 py-3 text-[15px] font-medium text-paper hover:bg-ink-2"
              >
                무료로 시작하기
              </Link>
              <Link to="/auth" className="text-[15px] text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-ink hover:decoration-ink">
                이미 계정이 있어요
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <ListSpecimen />
          </div>
        </section>

        {/* 사용법 */}
        <section className="border-t border-rule bg-paper-2/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-12">
              <h2 className="break-keep font-serif text-3xl font-semibold tracking-tight lg:col-span-4">
                이렇게 씁니다
              </h2>
              <ol className="lg:col-span-8">
                {STEPS.map((step, i) => (
                  <li
                    key={step.title}
                    className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-rule py-6 first:border-t-0 first:pt-0 sm:grid-cols-[3rem_1fr]"
                  >
                    <span className="pt-0.5 font-mono text-sm text-ink-3 tabular">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
                      <p className="mt-1.5 max-w-xl break-keep leading-relaxed text-ink-2">{step.body}</p>
                      {step.demo && <ParseDemo />}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 마무리 */}
        <section className="border-t border-rule">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="break-keep font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              오늘 할 일부터 적어 보세요.
            </p>
            <Link
              to="/auth?mode=register"
              className="flex-shrink-0 rounded bg-ink px-5 py-3 text-[15px] font-medium text-paper hover:bg-ink-2"
            >
              무료로 시작하기
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 font-mono text-xs text-ink-3 sm:px-6">
          <span>TaskGenie · MIT License</span>
          <a
            href="https://github.com/GOGEON/TaskGenie"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-ink"
          >
            GitHub <RiArrowRightUpLine />
          </a>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
