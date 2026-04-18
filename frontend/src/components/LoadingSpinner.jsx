import React from 'react';

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-3',
};

const LoadingSpinner = ({ size = 'md' }) => (
  <span
    className={`inline-block rounded-full border-blue-500 border-t-transparent animate-spin ${sizeMap[size]}`}
    role="status"
    aria-label="Loading"
  />
);

export default LoadingSpinner;
