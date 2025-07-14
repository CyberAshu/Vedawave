import React, { useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import chatService from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import EmojiPicker from 'emoji-picker-react';


const FILE_BASE_URL = process.env.REACT_APP_FILE_BASE_URL;

const MessageInput = ({ onSendMessage, chatId }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { sendTypingIndicator } = useSocket();
  const { token } = useAuth();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const CHARACTER_LIMIT = 500; // Changed from word limit to character limit
  
  // Helper function to count characters (including emojis properly)
  const countCharacters = (text) => {
    // Use Array.from to properly handle Unicode characters including emojis
    return Array.from(text).length;
  };
  
  // Helper function to truncate text to character limit
  const truncateText = (text, limit) => {
    const chars = Array.from(text);
    return chars.slice(0, limit).join('');
  };
  
  const characterCount = countCharacters(message);
  const isOverLimit = characterCount > CHARACTER_LIMIT;

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    
    // Only update if within character limit or if user is deleting
    if (countCharacters(newValue) <= CHARACTER_LIMIT || newValue.length < message.length) {
      setMessage(newValue);
    } else {
      // Truncate to character limit
      const truncatedValue = truncateText(newValue, CHARACTER_LIMIT);
      setMessage(truncatedValue);
    }
    
    // Handle typing indicator
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(chatId, true);
    }
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(chatId, false);
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !isOverLimit) {
      onSendMessage(message.trim(), 'text', attachments);
      setMessage('');
      setAttachments([]);
      
      // Reset textarea height to original state
      if (textareaRef.current) {
        textareaRef.current.style.height = '46px';
      }
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        sendTypingIndicator(chatId, false);
      }
      
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        const uploadedFile = await chatService.uploadFile(token, file);
        setAttachments(prev => [...prev, uploadedFile]);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onEmojiClick = (emojiData) => {
    const newMessage = message + emojiData.emoji;
    // Check if adding this emoji would exceed the limit
    if (countCharacters(newMessage) <= CHARACTER_LIMIT) {
      setMessage(newMessage);
    } else {
      // Show a brief warning or just don't add the emoji
      console.warn('Adding this emoji would exceed the character limit');
    }
    setShowEmojiPicker(false);
  };

  return (
    <div className="space-y-2">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
              {attachment.file_type && attachment.file_type.startsWith('image/') ? (
                <div className="space-y-2">
                  <img 
                    src={`${FILE_BASE_URL}${attachment.file_url}`}
                    alt={attachment.filename}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-16">
                    {attachment.filename}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-32">
                    {attachment.filename}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 dark:bg-red-600 text-white rounded-full text-xs hover:bg-red-600 dark:hover:bg-red-700 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Message Input */}
      <form onSubmit={handleSubmit} className="flex items-stretch space-x-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 flex-shrink-0 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500"
          title="Attach file"
          style={{ height: '46px', width: '46px', alignSelf: 'flex-end' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,*/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex-1 min-w-0">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isOverLimit) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type your message here..."
              className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 resize-none transition-all duration-200 block ${
                isOverLimit ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              rows={1}
              style={{ 
                minHeight: '46px', 
                lineHeight: '1.5',
                paddingBottom: isOverLimit ? '40px' : '12px'
              }}
              onInput={(e) => {
                // Reset height to auto to get accurate scrollHeight
                e.target.style.height = 'auto';
                // Set height based on content, with min and max constraints
                const newHeight = Math.max(46, Math.min(e.target.scrollHeight, 200));
                e.target.style.height = newHeight + 'px';
              }}
            />
            
            {/* Character count indicator */}
            {isOverLimit && (
              <div className="absolute bottom-1 left-0 right-0 px-4 pb-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {characterCount}/{CHARACTER_LIMIT} characters - Limit exceeded
                  </span>
                </div>
              </div>
            )}
            
            {/* Character count indicator for messages nearing limit */}
            {!isOverLimit && characterCount > CHARACTER_LIMIT * 0.8 && (
              <div className="absolute bottom-1 right-4 text-xs text-gray-500 dark:text-gray-400">
                {characterCount}/{CHARACTER_LIMIT}
              </div>
            )}
          </div>
        </div>
        
        <div className="relative" style={{ alignSelf: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 flex-shrink-0 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500"
            title="Add emoji"
            style={{ height: '46px', width: '46px' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-12 right-0 z-50">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={(!message.trim() && attachments.length === 0) || isOverLimit}
          className={`rounded-lg transition-all duration-200 flex-shrink-0 flex items-center justify-center ${
            (message.trim() || attachments.length > 0) && !isOverLimit
              ? 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 shadow-md hover:shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
          title={isOverLimit ? 'Character limit exceeded' : 'Send message'}
          style={{ height: '46px', width: '46px', alignSelf: 'flex-end' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
