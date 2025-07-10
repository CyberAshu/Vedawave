import React from 'react';

const Badge = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <div className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full">
      {count > 99 ? '99+' : count}
    </div>
  );
};

export default Badge;
