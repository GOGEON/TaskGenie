import React from 'react';

function ProgressBar({ progress }) {
  return (
    // <!-- [수정] 모바일에서 더 컴팩트하게 -->
    <div className="w-full">
      <div className="flex justify-between items-end mb-1 sm:mb-2">
        <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</span>
        <span className="text-xs sm:text-sm font-bold text-indigo-600">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 sm:h-2.5 overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          {/* Subtle gloss effect for premium feel, not cheap shimmer */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
