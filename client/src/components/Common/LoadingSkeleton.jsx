import React from 'react';

const LoadingSkeleton = ({ count = 3, height = 'h-16', className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`w-full ${height} rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 animate-pulse`}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
