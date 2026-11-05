import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { jwtDecode } from 'jwt-decode';
import Sidebar from '../src/components/Sidebar';
import { getDisplayName, getInitial } from '../src/utils/displayName';

/** 백엔드 create_access_token과 같은 형태({ sub, exp })의 토큰 생성 (서명 검증 없음) */
const makeToken = (payload) => {
  const encode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
};

const renderSidebar = (user) =>
  render(
    <Sidebar
      user={user}
      projects={[]}
      activeProjectId={null}
      onSelectProject={() => {}}
      onAddNewProject={() => {}}
      onLogout={() => {}}
    />
  );

describe('getDisplayName', () => {
  it('returns the username from the sub claim', () => {
    expect(getDisplayName({ sub: 'hong', exp: 0 })).toBe('hong');
    expect(getDisplayName({ sub: '홍길동' })).toBe('홍길동');
  });

  it('strips social login provider prefixes', () => {
    expect(getDisplayName({ sub: 'google_hong' })).toBe('hong');
    expect(getDisplayName({ sub: 'naver_hong' })).toBe('hong');
    expect(getDisplayName({ sub: 'kakao_12345' })).toBe('12345');
  });

  it('keeps underscores that are not a provider prefix', () => {
    expect(getDisplayName({ sub: 'my_name' })).toBe('my_name');
    expect(getDisplayName({ sub: 'kakao_' })).toBe('kakao_');
  });

  it('falls back to the default name when there is no username', () => {
    expect(getDisplayName(null)).toBe('사용자');
    expect(getDisplayName({})).toBe('사용자');
    expect(getDisplayName({ sub: '   ' })).toBe('사용자');
  });
});

describe('getInitial', () => {
  it('returns the uppercased first character', () => {
    expect(getInitial('hong')).toBe('H');
    expect(getInitial('홍길동')).toBe('홍');
    expect(getInitial('')).toBe('사');
  });
});

describe('Sidebar user area', () => {
  it('shows the logged-in user name and initial from a backend token', () => {
    const user = jwtDecode(makeToken({ sub: 'hong', exp: 9999999999 }));
    renderSidebar(user);

    expect(screen.getByText('hong')).toBeInTheDocument();
    expect(screen.getByText('H')).toBeInTheDocument();
    expect(screen.queryByText('사용자')).not.toBeInTheDocument();
  });

  it('shows social login users without the provider prefix', () => {
    const user = jwtDecode(makeToken({ sub: 'google_hong', exp: 9999999999 }));
    renderSidebar(user);

    expect(screen.getByText('hong')).toBeInTheDocument();
    expect(screen.queryByText('google_hong')).not.toBeInTheDocument();
  });
});
