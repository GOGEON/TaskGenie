import React from 'react';

function ProgressBar({ progress }) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</span>
        <span className="text-sm font-bold text-indigo-600">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
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
