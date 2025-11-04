import React from 'react';

function ProgressBar({ progress }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-5 sm:h-6 relative overflow-hidden">
      <div
        className="bg-gradient-to-r from-blue-500 to-blue-600 h-5 sm:h-6 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold transition-all duration-500 ease-out progress-bar relative overflow-hidden"
        style={{ width: `${progress}%` }}
      >
        <span className="drop-shadow-sm relative z-10">{progress.toFixed(0)}%</span>
        {/* 반짝이는 효과 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer" 
             style={{
               backgroundSize: '200% 100%',
               animation: 'shimmer 2s infinite linear'
             }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
