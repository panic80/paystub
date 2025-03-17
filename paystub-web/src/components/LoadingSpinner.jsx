import React from 'react';

const LoadingSpinner = ({ size = 'md', label = 'Loading...' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex justify-center items-center" role="status">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className={`rounded-full bg-blue-100 dark:bg-blue-900 ${size === 'sm' ? 'p-2' : size === 'md' ? 'p-3' : 'p-4'}`}>
            <svg 
              className={`${sizes[size]} text-blue-600 dark:text-blue-300 animate-spin`} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
        {label && (
          <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300" aria-live="polite">
            {label}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;