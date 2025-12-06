/**
 * Axios API 인스턴스 모듈
 * 
 * 백엔드 API와의 HTTP 통신을 담당하는 Axios 인스턴스.
 * 
 * 주요 기능:
 * - 기본 URL 설정 (환경 변수 기반)
 * - 요청 시 JWT 토큰 자동 첨부
 * - 401 응답 시 자동 로그아웃 처리
 * 
 * @module api
 */
import axios from 'axios';
import { loadToken, removeToken } from './localStorageService';

// Axios 인스턴스 생성 (기본 URL은 환경변수 또는 localhost)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
});


// ==================== 요청 인터셉터 ====================
// 모든 요청에 JWT 토큰 자동 첨부
api.interceptors.request.use(
  (config) => {
    const token = loadToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// ==================== 응답 인터셉터 ====================
// 401 에러 시 자동 로그아웃 (토큰 만료/무효)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;