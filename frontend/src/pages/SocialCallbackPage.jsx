import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleNaverCallback, handleKakaoCallback } from '../services/socialAuthService';
import toast from 'react-hot-toast';

function SocialCallbackPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pathname = window.location.pathname;

  useEffect(() => {
    const handleCallback = async () => {
      try {
        let result;

        if (pathname.includes('/auth/naver/callback')) {
          // 네이버 콜백 처리
          const code = searchParams.get('code');
          const state = searchParams.get('state');
          
          if (!code || !state) {
            throw new Error('Missing code or state parameter');
          }

          result = await handleNaverCallback(code, state);
          toast.success('네이버 로그인 성공!');
        } else if (pathname.includes('/auth/kakao/callback')) {
          // 카카오 콜백 처리
          const code = searchParams.get('code');
          
          if (!code) {
            throw new Error('Missing code parameter');
          }

          result = await handleKakaoCallback(code);
          toast.success('카카오 로그인 성공!');
        }

        if (result) {
          onLoginSuccess(result.access_token);
          navigate('/');
        }
      } catch (error) {
        console.error('소셜 로그인 콜백 오류:', error);
        toast.error('로그인 처리 중 오류가 발생했습니다.');
        navigate('/auth');
      }
    };

    handleCallback();
  }, [pathname, searchParams, navigate, onLoginSuccess]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">로그인 처리 중...</p>
        </div>
      </div>
    </div>
  );
}

export default SocialCallbackPage;
