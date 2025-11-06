import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth, googleProvider } from './firebaseConfig';
import axios from 'axios';
import { saveToken } from './localStorageService';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Google 로그인
 * @param {boolean} useRedirect - 모바일에서는 true 권장
 */
export const signInWithGoogle = async (useRedirect = false) => {
  try {
    let result;
    if (useRedirect) {
      await signInWithRedirect(auth, googleProvider);
      return null; // 리디렉션 후 처리는 handleRedirectResult에서
    } else {
      result = await signInWithPopup(auth, googleProvider);
    }
    
    const user = result.user;
    const idToken = await user.getIdToken();
    
    // 백엔드에 소셜 로그인 정보 전송
    const response = await axios.post(`${API_BASE_URL}/auth/social-login`, {
      provider: 'google',
      id_token: idToken,
      email: user.email,
      display_name: user.displayName,
      photo_url: user.photoURL
    });
    
    saveToken(response.data.access_token);
    return response.data;
  } catch (error) {
    console.error('Google 로그인 오류:', error);
    throw error;
  }
};

/**
 * 네이버 로그인
 */
export const signInWithNaver = async () => {
  try {
    const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID;
    const REDIRECT_URI = encodeURIComponent(window.location.origin + '/auth/naver/callback');
    const STATE = Math.random().toString(36).substring(7);
    
    // 상태값 저장 (CSRF 방지)
    sessionStorage.setItem('naver_oauth_state', STATE);
    
    // 네이버 로그인 페이지로 리디렉션
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;
    
    window.location.href = naverAuthUrl;
  } catch (error) {
    console.error('네이버 로그인 오류:', error);
    throw error;
  }
};

/**
 * 네이버 로그인 콜백 처리
 */
export const handleNaverCallback = async (code, state) => {
  try {
    const savedState = sessionStorage.getItem('naver_oauth_state');
    
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }
    
    sessionStorage.removeItem('naver_oauth_state');
    
    // 백엔드에서 액세스 토큰 교환 및 사용자 정보 조회
    const response = await axios.post(`${API_BASE_URL}/auth/naver-callback`, {
      code,
      state,
      redirect_uri: window.location.origin + '/auth/naver/callback'
    });
    
    saveToken(response.data.access_token);
    return response.data;
  } catch (error) {
    console.error('네이버 콜백 처리 오류:', error);
    throw error;
  }
};

/**
 * 카카오 로그인 (REST API 방식)
 */
export const signInWithKakao = async () => {
  try {
    const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const REDIRECT_URI = encodeURIComponent(window.location.origin + '/auth/kakao/callback');
    
    // 카카오 로그인 페이지로 리디렉션
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
    
    window.location.href = kakaoAuthUrl;
  } catch (error) {
    console.error('카카오 로그인 오류:', error);
    throw error;
  }
};

/**
 * 카카오 로그인 콜백 처리
 */
export const handleKakaoCallback = async (code) => {
  try {
    // 백엔드에서 액세스 토큰 교환 및 사용자 정보 조회
    const response = await axios.post(`${API_BASE_URL}/auth/kakao-callback`, {
      code,
      redirect_uri: window.location.origin + '/auth/kakao/callback'
    });
    
    saveToken(response.data.access_token);
    return response.data;
  } catch (error) {
    console.error('카카오 콜백 처리 오류:', error);
    throw error;
  }
};

/**
 * 리디렉션 결과 처리 (Google 모바일에서 사용)
 */
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    
    const user = result.user;
    const idToken = await user.getIdToken();
    
    const response = await axios.post(`${API_BASE_URL}/auth/social-login`, {
      provider: 'google',
      id_token: idToken,
      email: user.email,
      display_name: user.displayName,
      photo_url: user.photoURL
    });
    
    saveToken(response.data.access_token);
    return response.data;
  } catch (error) {
    console.error('리디렉션 결과 처리 오류:', error);
    throw error;
  }
};

/**
 * 로그아웃
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    localStorage.removeItem('access_token');
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw error;
  }
};
