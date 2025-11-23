import React, { useState, useEffect } from 'react';
import { RiRocketLine, RiTaskLine, RiLightbulbLine, RiArrowRightLine, RiCheckDoubleLine, RiBarChartLine } from 'react-icons/ri';

/**
 * OnboardingGuide 컴포넌트
 * 첫 방문 사용자를 위한 온보딩 가이드
 */
const OnboardingGuide = ({ onClose, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 첫 방문 여부 체크
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const steps = [
    {
      icon: <RiRocketLine className="w-16 h-16 text-indigo-500" />,
      title: 'TaskGenie에 오신 걸 환영합니다!',
      description: 'AI가 도와주는 스마트한 할 일 관리 도구입니다.',
      tip: '간단한 키워드만 입력하면 AI가 자동으로 세부 작업을 생성해드립니다.'
    },
    {
      icon: <RiTaskLine className="w-16 h-16 text-indigo-500" />,
      title: 'AI 기반 작업 생성',
      description: '"운동하기", "프로젝트 기획" 같은 키워드를 입력하세요.',
      tip: 'AI가 자동으로 체계적인 할 일 목록을 만들어드립니다.'
    },
    {
      icon: <RiCheckDoubleLine className="w-16 h-16 text-indigo-500" />,
      title: '계층적 작업 관리',
      description: '각 작업에 하위 작업을 무제한으로 추가할 수 있습니다.',
      tip: '우클릭 메뉴나 컨텍스트 메뉴를 통해 세부 작업을 생성하세요.'
    },
    {
      icon: <RiBarChartLine className="w-16 h-16 text-indigo-500" />,
      title: '실시간 진행률 추적',
      description: '작업 완료 상태가 자동으로 계산되고 시각화됩니다.',
      tip: '부모 작업의 진행률은 하위 작업들의 완료 상태를 반영합니다.'
    },
    {
      icon: <RiRocketLine className="w-16 h-16 text-indigo-500" />,
      title: '시작할 준비가 되었습니다!',
      description: '이제 첫 프로젝트를 만들어보세요.',
      tip: '언제든 도움말에서 이 가이드를 다시 볼 수 있습니다.'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleSkipAll = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsVisible(false);
    if (onSkip) onSkip();
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in border border-slate-200">
        {/* 진행률 표시 */}
        <div className="h-1 bg-slate-100">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* 컨텐츠 */}
        <div className="p-8">
          {/* 아이콘 */}
          <div className="mb-6 text-center animate-bounce-slow flex justify-center">
            {currentStepData.icon}
          </div>

          {/* 제목 */}
          <h2 className="text-2xl font-bold text-slate-800 mb-3 text-center">
            {currentStepData.title}
          </h2>

          {/* 설명 */}
          <p className="text-slate-600 mb-4 text-center leading-relaxed">
            {currentStepData.description}
          </p>

          {/* 팁 */}
          <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-100">
            <div className="flex items-start space-x-2">
              <span className="text-xl flex-shrink-0 text-indigo-500"><RiLightbulbLine /></span>
              <p className="text-sm text-indigo-900">
                {currentStepData.tip}
              </p>
            </div>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkipAll}
              className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
              건너뛰기
            </button>

            <div className="flex items-center space-x-2">
              {/* 진행 인디케이터 */}
              <div className="flex space-x-1.5">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentStep 
                        ? 'bg-indigo-500 w-6' 
                        : index < currentStep 
                          ? 'bg-indigo-300' 
                          : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* 이전/다음 버튼 */}
              <div className="flex space-x-2 ml-4">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                  >
                    이전
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-1"
                >
                  {currentStep === steps.length - 1 ? '시작하기' : '다음'}
                  <RiArrowRightLine />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuide;
