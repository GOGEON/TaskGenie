import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from './firebaseConfig';
import axios from 'axios';
import { saveToken } from './localStorageService';

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
    const response = await axios.post('http://localhost:8000/auth/social-login', {
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
 * GitHub 로그인
 * @param {boolean} useRedirect - 모바일에서는 true 권장
 */
export const signInWithGithub = async (useRedirect = false) => {
  try {
    let result;
    if (useRedirect) {
      await signInWithRedirect(auth, githubProvider);
      return null;
    } else {
      result = await signInWithPopup(auth, githubProvider);
    }
    
    const user = result.user;
    const idToken = await user.getIdToken();
    
    // 백엔드에 소셜 로그인 정보 전송
    const response = await axios.post('http://localhost:8000/auth/social-login', {
      provider: 'github',
      id_token: idToken,
      email: user.email,
      display_name: user.displayName,
      photo_url: user.photoURL
    });
    
    saveToken(response.data.access_token);
    return response.data;
  } catch (error) {
    console.error('GitHub 로그인 오류:', error);
    throw error;
  }
};

/**
 * 리디렉션 결과 처리 (모바일에서 사용)
 */
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    
    const user = result.user;
    const idToken = await user.getIdToken();
    
    // Provider 정보 확인
    const provider = result.providerId.includes('google') ? 'google' : 'github';
    
    const response = await axios.post('http://localhost:8000/auth/social-login', {
      provider,
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
