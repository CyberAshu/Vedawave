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
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
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
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), 'text', attachments);
      setMessage('');
      setAttachments([]);
      
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
    setMessage(prevMessage => prevMessage + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="space-y-2">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
          {attachments.map((attachment, index) => (
            <div key={index} className="relative bg-white p-2 rounded border">
              {attachment.file_type && attachment.file_type.startsWith('image/') ? (
                <div className="space-y-2">
                  <img 
                    src={`${FILE_BASE_URL}${attachment.file_url}`}
                    alt={attachment.filename}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="text-xs text-gray-600 truncate max-w-16">
                    {attachment.filename}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-600 truncate max-w-32">
                    {attachment.filename}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center"
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
          className="flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 flex-shrink-0 border border-gray-200 hover:border-blue-300"
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
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type your message here..."
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 block"
            rows={1}
            style={{ minHeight: '46px', height: '46px', lineHeight: '1.5' }}
            onInput={(e) => {
              // Reset height to auto to get accurate scrollHeight
              e.target.style.height = 'auto';
              // Set height based on content, with min and max constraints
              const newHeight = Math.max(46, Math.min(e.target.scrollHeight, 120));
              e.target.style.height = newHeight + 'px';
            }}
          />
        </div>
        
        <div className="relative" style={{ alignSelf: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 flex-shrink-0 border border-gray-200 hover:border-blue-300"
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
          disabled={!message.trim() && attachments.length === 0}
          className={`rounded-lg transition-all duration-200 flex-shrink-0 flex items-center justify-center ${
            message.trim() || attachments.length > 0
              ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Send message"
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
