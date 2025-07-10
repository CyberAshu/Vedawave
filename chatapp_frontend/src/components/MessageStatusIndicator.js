import React from 'react';

const MessageStatusIndicator = ({ status }) => {
  const SingleTick = () => (
    <div className="inline-flex items-center justify-center" title="Sent">
      <svg className="w-4 h-4 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </div>
  );

  const DoubleTick = () => (
    <div className="relative inline-flex items-center justify-center w-5 h-4" title="Delivered">
      {/* Background tick */}
      <svg className="w-4 h-4 text-white opacity-80 absolute left-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      {/* Foreground tick */}
      <svg className="w-4 h-4 text-white opacity-80 absolute left-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </div>
  );

  const SeenDoubleTick = () => (
    <div className="relative inline-flex items-center justify-center w-5 h-4" title="Seen">
      {/* Background tick */}
      <svg className="w-4 h-4 text-blue-300 absolute left-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      {/* Foreground tick */}
      <svg className="w-4 h-4 text-blue-300 absolute left-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </div>
  );

  switch (status) {
    case 'sent':
      return <SingleTick />;
    case 'delivered':
      return <DoubleTick />;
    case 'seen':
      return <SeenDoubleTick />;
    default:
      return null;
  }
};

export default MessageStatusIndicator;
