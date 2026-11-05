/**
 * 인증 페이지 컴포넌트
 * 
 * 사용자 로그인 및 회원가입을 처리하는 페이지.
 * 이메일/비밀번호 인증과 소셜 로그인(Google, Kakao)을 모두 지원.
 * 
 * @module AuthPage
 */
import React, { useState } from 'react';
import { register, login } from '../services/authApiService';
import { saveToken } from '../services/localStorageService';
import { signInWithGoogle, signInWithKakao } from '../services/socialAuthService';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import Wordmark from '../components/Wordmark';


function AuthPage({ onLoginSuccess }) {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('mode') === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await register(email, password);
        toast.success('회원가입에 성공했습니다! 로그인 해주세요.');
        setIsRegister(false);
      } else {
        const token = await login(email, password);
        saveToken(token);
        onLoginSuccess(token);
      }
    } catch (err) {
      console.error('인증 오류:', err);
      setError(err.response?.data?.detail || '인증 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setError(null);
    setLoading(true);
    
    try {
      if (provider === 'google') {
        const result = await signInWithGoogle();
        if (result) {
          toast.success('Google 로그인 성공!');
          onLoginSuccess(result.access_token);
        }
      } else if (provider === 'kakao') {
        await signInWithKakao();
      }
    } catch (err) {
      console.error('소셜 로그인 오류:', err);
      const errorMessage = err.code === 'auth/popup-closed-by-user' 
        ? '로그인 팝업이 닫혔습니다.' 
        : err.response?.data?.detail || '소셜 로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded border border-rule-strong bg-sheet px-3.5 py-2.5 text-[15px] text-ink transition-colors focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink';

  // 단일 열 폼 레이아웃 (브랜딩 패널 없음 — 소개는 랜딩 페이지가 담당)
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
        <Link to="/" aria-label="TaskGenie 홈">
          <Wordmark />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[400px] px-4 pb-16 pt-8 sm:pt-16">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">
          {isRegister ? '계정 만들기' : '로그인'}
        </h1>
        <p className="mt-2 text-[15px] text-ink-3">
          {isRegister ? '이메일과 비밀번호만 있으면 됩니다.' : '이메일 또는 소셜 계정으로 로그인하세요.'}
        </p>

        {error && (
          <div role="alert" className="mt-6 border-l-2 border-accent bg-accent-wash px-3 py-2.5 text-sm text-accent-ink">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-sm font-medium text-ink-2">이메일</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="mb-1.5 block text-sm font-medium text-ink-2">비밀번호</label>
            <input
              id="auth-password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-ink px-4 py-3 text-[15px] font-medium text-paper transition-colors hover:bg-ink-2 disabled:opacity-50"
          >
            {loading ? '처리 중…' : (isRegister ? '계정 만들기' : '로그인')}
          </button>
        </form>

        {/* 구분선 */}
        <div className="my-7 flex items-center gap-3 font-mono text-xs text-ink-3">
          <div className="h-px flex-1 bg-rule" />
          또는
          <div className="h-px flex-1 bg-rule" />
        </div>

        {/* 소셜 로그인 */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2.5 rounded border border-rule-strong bg-sheet px-4 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-paper-2 disabled:opacity-50"
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Google로 계속하기
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin('kakao')}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2.5 rounded bg-[#FEE500] px-4 py-2.5 text-[15px] font-medium text-[#191919] transition-[filter] hover:brightness-95 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 1.25C5.16751 1.25 1.25 4.32076 1.25 8.125C1.25 10.4658 2.65326 12.5282 4.82024 13.8146L3.87281 17.3485C3.80863 17.5923 4.02938 17.8077 4.26375 17.7163L8.44592 15.7893C8.95364 15.8621 9.47217 15.9 10 15.9C14.8325 15.9 18.75 12.8292 18.75 9.025C18.75 5.22076 14.8325 1.25 10 1.25Z" fill="#191919"/>
            </svg>
            카카오로 계속하기
          </button>
        </div>

        {/* 전환 링크 */}
        <p className="mt-8 text-sm text-ink-3">
          {isRegister ? '이미 계정이 있나요?' : '처음이신가요?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="font-medium text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink"
          >
            {isRegister ? '로그인' : '계정 만들기'}
          </button>
        </p>
      </main>
    </div>
  );
}

export default AuthPage;
