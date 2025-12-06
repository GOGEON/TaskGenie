/**
 * 로컬 스토리지 서비스 모듈
 * 
 * 브라우저의 localStorage를 사용한 데이터 영구 저장 처리.
 * 
 * 주요 기능:
 * - JWT 인증 토큰 저장/로드/삭제
 * - 사용자 설정(Preferences) 저장/로드
 * - 예외 처리 (스토리지 접근 불가 등)
 * 
 * @module localStorageService
 */
const TOKEN_KEY = 'authToken';
const LOCAL_STORAGE_KEY = 'aiTaskGeneratorPreferences';


/**
 * 인증 토큰 저장.
 * 
 * @param {string} token - JWT 액세스 토큰
 */
export const saveToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token to local storage:', error);
  }
};


/**
 * 인증 토큰 로드.
 * 
 * @returns {string|null} 저장된 토큰 또는 null
 */
export const loadToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error loading token from local storage:', error);
    return null;
  }
};


/**
 * 인증 토큰 삭제 (로그아웃).
 */
export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token from local storage:', error);
  }
};


/**
 * 사용자 설정 저장.
 * 객체를 JSON 문자열로 변환하여 저장.
 * 
 * @param {Object} preferences - 설정 객체
 */
export const savePreferences = (preferences) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences to local storage:', error);
  }
};


/**
 * 사용자 설정 로드.
 * 저장된 JSON 문자열을 객체로 파싱.
 * 
 * @returns {Object} 설정 객체 (없으면 빈 객체)
 */
export const loadPreferences = () => {
  try {
    const preferences = localStorage.getItem(LOCAL_STORAGE_KEY);
    return preferences ? JSON.parse(preferences) : {};
  } catch (error) {
    console.error('Error loading preferences from local storage:', error);
    return {};
  }
};
