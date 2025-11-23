import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleNaverCallback, handleKakaoCallback } from '../services/socialAuthService';
import toast from 'react-hot-toast';

function SocialCallbackPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pathname = window.location.pathname;
  const hasProcessed = useRef(false); // 중복 실행 방지

  useEffect(() => {
    // 이미 처리했으면 스킵
    if (hasProcessed.current) {
      return;
    }

    const handleCallback = async () => {
      try {
        hasProcessed.current = true; // 처리 시작 표시
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
  }, []); // 의존성 배열 비우기 - 한 번만 실행

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="bg-white p-8 rounded-lg shadow-xl border border-slate-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-600">로그인 처리 중...</p>
        </div>
      </div>
    </div>
  );
}

export default SocialCallbackPage;
