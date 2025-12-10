/**
 * 인증 페이지 컴포넌트
 * 
 * 사용자 로그인 및 회원가입을 처리하는 페이지.
 * 이메일/비밀번호 인증과 소셜 로그인(Google, Kakao)을 모두 지원.
 * 
 * @module AuthPage
 */
import React, { useState } from 'react';
import api from '../services/api';
import { saveToken } from '../services/localStorageService';
import { signInWithGoogle, signInWithKakao } from '../services/socialAuthService';
import toast from 'react-hot-toast';
import { RiRocketLine } from 'react-icons/ri';


function AuthPage({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
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
        const username = email.split('@')[0];
        await api.post('/auth/register', { username, password, email });
        toast.success('회원가입에 성공했습니다! 로그인 해주세요.');
        setIsRegister(false);
      } else {
        const username = email.split('@')[0];
        const response = await api.post('/auth/login', `username=${username}&password=${password}`, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        saveToken(response.data.access_token);
        onLoginSuccess(response.data.access_token);
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

  // <!-- [수정] 브랜딩 영역 제거, 중앙 정렬 단일 폼 레이아웃 -->
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <RiRocketLine className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-800">TaskGenie</span>
        </div>

        {/* 폼 카드 */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <h2 className="text-2xl font-bold text-center mb-2 text-slate-800">
            {isRegister ? '계정 만들기' : '다시 오신 것을 환영합니다'}
          </h2>
          <p className="text-center text-slate-500 mb-6 text-sm">
            {isRegister ? 'TaskGenie와 함께 생산성을 높여보세요' : '계속하려면 로그인하세요'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : (isRegister ? '회원가입' : '로그인')}
            </button>
          </form>

          {/* 구분선 */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-4 text-sm text-slate-400">또는</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {/* 소셜 로그인 */}
          <div className="space-y-3">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span className="text-slate-700 font-medium">Google로 계속하기</span>
            </button>

            <button
              onClick={() => handleSocialLogin('kakao')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-[#191919] bg-[#FEE500] hover:brightness-95 transition-all disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 1.25C5.16751 1.25 1.25 4.32076 1.25 8.125C1.25 10.4658 2.65326 12.5282 4.82024 13.8146L3.87281 17.3485C3.80863 17.5923 4.02938 17.8077 4.26375 17.7163L8.44592 15.7893C8.95364 15.8621 9.47217 15.9 10 15.9C14.8325 15.9 18.75 12.8292 18.75 9.025C18.75 5.22076 14.8325 1.25 10 1.25Z" fill="#191919"/>
              </svg>
              <span>카카오로 로그인</span>
            </button>
          </div>

          {/* 전환 링크 */}
          <p className="mt-6 text-center text-sm text-slate-500">
            {isRegister ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}{' '}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {isRegister ? '로그인' : '회원가입'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
