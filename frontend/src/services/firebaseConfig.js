/**
 * Firebase 설정 모듈
 * 
 * Firebase 앱 초기화 및 인증 서비스 구성.
 * 환경 변수(.env)에서 설정값을 로드하여 보안 유지.
 * 
 * 주요 기능:
 * - Firebase App 초기화
 * - Auth 서비스 내보내기
 * - Google Auth Provider 설정
 * 
 * @module firebaseConfig
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase 설정 (환경 변수로 관리 권장)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "taskgenie-477403.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "taskgenie-477403",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "taskgenie-477403.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Authentication 초기화
export const auth = getAuth(app);

// Google Provider
export const googleProvider = new GoogleAuthProvider();

export default app;
