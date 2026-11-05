/**
 * 사용자 표시 이름 유틸리티
 *
 * 디코딩된 JWT 페이로드에서 사이드바 등에 보여줄 이름을 만든다.
 * 백엔드 토큰은 `{ sub: username, exp }` 형태이므로 `sub`를 사용한다.
 *
 * @module displayName
 */

/** 사용자 이름을 알 수 없을 때 표시할 기본값 */
export const DEFAULT_DISPLAY_NAME = '사용자';

/**
 * 소셜 로그인 시 백엔드가 username 앞에 붙이는 접두사.
 * (backend/src/api/auth_firestore.py 참고)
 */
const SOCIAL_PREFIX_PATTERN = /^(google|naver|kakao)_(.+)$/;

/**
 * 디코딩된 토큰 페이로드에서 표시 이름 추출.
 *
 * 소셜 로그인 사용자(`google_hong`, `naver_hong`, `kakao_12345`)는
 * 제공자 접두사를 제거하여 `hong`, `12345`처럼 표시한다.
 *
 * @param {Object|null} user - jwtDecode로 디코딩된 토큰 페이로드
 * @returns {string} 표시 이름
 */
export const getDisplayName = (user) => {
  const username = typeof user?.sub === 'string' ? user.sub.trim() : '';
  if (!username) return DEFAULT_DISPLAY_NAME;

  const match = username.match(SOCIAL_PREFIX_PATTERN);
  return match ? match[2] : username;
};

/**
 * 표시 이름의 첫 글자(아바타 이니셜) 추출.
 *
 * @param {string} name - 표시 이름
 * @returns {string} 대문자로 변환한 첫 글자
 */
export const getInitial = (name) => Array.from(name || DEFAULT_DISPLAY_NAME)[0].toUpperCase();
