import React, { useState } from 'react';

const MessageContent = ({ content, isOwnMessage = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const WORD_LIMIT = 160;
  
  // Helper function to count words
  const countWords = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  
  // Helper function to get first N words
  const getFirstWords = (text, count) => {
    if (!text) return '';
    return text.trim().split(/\s+/).slice(0, count).join(' ');
  };
  
  // Helper function to get remaining words
  const getRemainingWords = (text, count) => {
    if (!text) return '';
    return text.trim().split(/\s+/).slice(count).join(' ');
  };
  
  const wordCount = countWords(content);
  const isOverLimit = wordCount > WORD_LIMIT;
  
  if (!isOverLimit) {
    return <div className="break-words">{content}</div>;
  }
  
  const firstPart = getFirstWords(content, WORD_LIMIT);
  const remainingPart = getRemainingWords(content, WORD_LIMIT);
  
  return (
    <div className="break-words">
      <div>
        {firstPart}
        {!isExpanded && (
          <>
            <span className="text-gray-400">...</span>
            <button
              onClick={() => setIsExpanded(true)}
              className={`ml-2 text-sm font-medium underline transition-colors ${
                isOwnMessage 
                  ? 'text-blue-200 hover:text-white' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              Read More
            </button>
          </>
        )}
      </div>
      
      {isExpanded && (
        <div>
          <span> {remainingPart}</span>
          <button
            onClick={() => setIsExpanded(false)}
            className={`ml-2 text-sm font-medium underline transition-colors ${
              isOwnMessage 
                ? 'text-blue-200 hover:text-white' 
                : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            Read Less
          </button>
        </div>
      )}
      
      {isOverLimit && (
        <div className={`text-xs mt-1 opacity-75 ${
          isOwnMessage ? 'text-blue-200' : 'text-gray-500'
        }`}>
          {wordCount} words
        </div>
      )}
    </div>
  );
};

export default MessageContent;
