
import React from 'react';

interface LoadingSpinnerProps {
    message: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-800/50 rounded-xl border border-slate-700">
      <div className="w-12 h-12 border-4 border-t-purple-400 border-r-purple-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-slate-300">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
