import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { saveToken } from '../services/localStorageService';
import { signInWithGoogle, signInWithGithub, handleRedirectResult } from '../services/socialAuthService';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import toast from 'react-hot-toast';

function AuthPage({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // Only for registration
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // 리디렉션 결과 처리 (모바일에서 소셜 로그인 후)
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await handleRedirectResult();
        if (result) {
          toast.success('소셜 로그인 성공!');
          onLoginSuccess(result.access_token);
        }
      } catch (err) {
        console.error('리디렉션 처리 오류:', err);
      }
    };
    checkRedirect();
  }, [onLoginSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        await axios.post('http://localhost:8000/auth/register', { username, password, email });
        alert('회원가입에 성공했습니다! 로그인 해주세요.');
        setIsRegister(false); // Switch to login after successful registration
      } else {
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
      // 모바일 감지 (간단한 방법)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (provider === 'google') {
        result = await signInWithGoogle(isMobile);
      } else if (provider === 'github') {
        result = await signInWithGithub(isMobile);
      }
      
      if (result) {
        toast.success(`${provider === 'google' ? 'Google' : 'GitHub'} 로그인 성공!`);
        onLoginSuccess(result.access_token);
      }
      // isMobile이고 리디렉션된 경우 result는 null (useEffect에서 처리)
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
            <label className="block text-sm font-medium text-gray-700 mb-1">사용자 이름</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일 (선택 사항)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full p-3 sm:p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px] sm:min-h-0"
              />
            </div>
          )}
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

        {/* 소셜 로그인 버튼 */}
        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 sm:py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm sm:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0 touch-manipulation transition-all hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaGoogle className="text-xl text-red-500" />
            <span>Google로 {isRegister ? '가입' : '로그인'}</span>
          </button>

          <button
            onClick={() => handleSocialLogin('github')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 sm:py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm sm:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0 touch-manipulation transition-all hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaGithub className="text-xl text-gray-800" />
            <span>GitHub로 {isRegister ? '가입' : '로그인'}</span>
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
