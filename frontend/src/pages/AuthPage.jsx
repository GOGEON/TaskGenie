import React, { useState } from 'react';
import axios from 'axios';
import { saveToken } from '../services/localStorageService';
import { signInWithGoogle, signInWithNaver, signInWithKakao } from '../services/socialAuthService';
import toast from 'react-hot-toast';

function AuthPage({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false); // 기본값을 false로 변경 (로그인 먼저)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Google 리디렉션 결과 처리 (제거 - 팝업 방식 사용)
  // useEffect는 제거하고 팝업 방식으로만 처리

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        // 이메일을 username으로 사용 (@ 앞부분)
        const username = email.split('@')[0];
        await axios.post('http://localhost:8000/auth/register', { username, password, email });
        toast.success('회원가입에 성공했습니다! 로그인 해주세요.');
        setIsRegister(false); // Switch to login after successful registration
      } else {
        // 이메일을 username으로 사용 (@ 앞부분)
        const username = email.split('@')[0];
        const response = await axios.post('http://localhost:8000/auth/login', `username=${username}&password=${password}`, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
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
      let result;
      
      if (provider === 'google') {
        // Google은 팝업 방식 사용 (로컬 개발 환경에서 안정적)
        result = await signInWithGoogle();
        
        if (result) {
          toast.success('Google 로그인 성공!');
          onLoginSuccess(result.access_token);
        }
      } else if (provider === 'naver') {
        // 네이버는 항상 리디렉션 방식
        await signInWithNaver();
        // 리디렉션되므로 여기는 실행되지 않음
      } else if (provider === 'kakao') {
        // 카카오는 항상 리디렉션 방식
        await signInWithKakao();
        // 리디렉션되므로 여기는 실행되지 않음
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md animate-scaleIn hover-lift">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">
          {isRegister ? '회원가입' : '로그인'}
        </h2>
        {error && <p className="text-red-500 text-center mb-4 text-sm sm:text-base bg-red-50 p-3 rounded-md animate-fadeIn">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="mt-1 block w-full p-3 sm:p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px] sm:min-h-0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-3 sm:p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px] sm:min-h-0"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 sm:py-2 px-4 border border-transparent rounded-md shadow-sm text-sm sm:text-base font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0 touch-manipulation transition-all hover-lift btn-ripple disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? '처리 중...' : (isRegister ? '회원가입' : '로그인')}
          </button>
        </form>

        {/* 구분선 */}
        <div className="mt-6 mb-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>
        </div>

        {/* 소셜 로그인 버튼 - 공식 디자인 가이드라인 준수 */}
        <div className="space-y-3">
          {/* Google Sign-In Button (Official Style) */}
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 sm:py-2.5 px-4 border border-[#747775] rounded-md shadow-sm text-sm sm:text-base font-medium text-[#1f1f1f] bg-white hover:bg-[#f8f9fa] active:bg-[#f1f3f4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4285f4] min-h-[44px] sm:min-h-0 touch-manipulation transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            <span>Google로 계속하기</span>
          </button>

          {/* 네이버 로그인 버튼 (공식 스타일 - NAVER GREEN #03C75A) */}
          <button
            onClick={() => handleSocialLogin('naver')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 sm:py-2.5 px-4 rounded-md shadow-sm text-sm sm:text-base font-bold text-white bg-[#03C75A] hover:bg-[#02b350] active:bg-[#019f45] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#03C75A] min-h-[44px] sm:min-h-0 touch-manipulation transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="font-black text-2xl leading-none" style={{ fontFamily: 'Arial Black, sans-serif' }}>N</span>
            <span>네이버로 로그인</span>
          </button>

          {/* 카카오 로그인 버튼 (공식 스타일) */}
          <button
            onClick={() => handleSocialLogin('kakao')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 sm:py-2.5 px-4 rounded-md shadow-sm text-sm sm:text-base font-medium text-[#000000] bg-[#FEE500] hover:brightness-95 active:brightness-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FEE500] min-h-[44px] sm:min-h-0 touch-manipulation transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ opacity: 0.85 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 1.25C5.16751 1.25 1.25 4.32076 1.25 8.125C1.25 10.4658 2.65326 12.5282 4.82024 13.8146L3.87281 17.3485C3.80863 17.5923 4.02938 17.8077 4.26375 17.7163L8.44592 15.7893C8.95364 15.8621 9.47217 15.9 10 15.9C14.8325 15.9 18.75 12.8292 18.75 9.025C18.75 5.22076 14.8325 1.25 10 1.25Z" fill="#000000"/>
            </svg>
            <span>카카오로 로그인</span>
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          {isRegister ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="font-medium text-blue-600 hover:text-blue-500 active:text-blue-700 focus:outline-none touch-manipulation"
          >
            {isRegister ? '로그인' : '회원가입'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
