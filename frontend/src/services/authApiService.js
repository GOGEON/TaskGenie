/**
 * 인증 API 서비스 모듈
 *
 * 회원가입, 로그인, 회원탈퇴 API 호출 함수.
 * (소셜 로그인은 socialAuthService 참고)
 *
 * @module authApiService
 */
import api from './api';

/**
 * 이메일 앞부분을 사용자 이름으로 사용.
 * @param {string} email - 이메일
 * @returns {string} 사용자 이름
 */
export const usernameFromEmail = (email) => email.split('@')[0];

/**
 * 회원가입.
 * @param {string} email - 이메일
 * @param {string} password - 비밀번호
 */
export const register = async (email, password) => {
  await api.post('/auth/register', { username: usernameFromEmail(email), password, email });
};

/**
 * 로그인.
 * @param {string} email - 이메일
 * @param {string} password - 비밀번호
 * @returns {Promise<string>} JWT 액세스 토큰
 */
export const login = async (email, password) => {
  const body = new URLSearchParams({ username: usernameFromEmail(email), password });
  const response = await api.post('/auth/login', body);
  return response.data.access_token;
};

/** 현재 사용자 계정 삭제 (모든 프로젝트/할 일 포함). */
export const deleteAccount = async () => {
  await api.delete('/auth/me');
};
