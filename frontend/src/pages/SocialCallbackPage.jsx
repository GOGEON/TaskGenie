/**
 * 소셜 로그인 콜백 페이지 컴포넌트
 * 
 * OAuth 2.0 인증 흐름에서 리다이렉트 URI로 사용되는 페이지.
 * 인증 코드를 받아 백엔드에 전달하고 액세스 토큰을 발급받음.
 * 
 * 주요 기능:
 * - URL에서 인증 코드(code) 및 상태(state) 파싱
 * - 소셜 제공자(Naver, Kakao) 식별 및 API 호출
 * - 중복 실행 방지 (useRef 사용)
 * - 로그인 성공/실패 처리 및 리다이렉트
 * 
 * @module SocialCallbackPage
 */
import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleNaverCallback, handleKakaoCallback } from '../services/socialAuthService';
import toast from 'react-hot-toast';


/**
 * SocialCallbackPage 컴포넌트.
 * 
 * @param {Object} props - 컴포넌트 속성
 * @param {Function} props.onLoginSuccess - 로그인 성공 콜백
 * @returns {JSX.Element} 로딩 스피너가 있는 콜백 처리 페이지
 */
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
