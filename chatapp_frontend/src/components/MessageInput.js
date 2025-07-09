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
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
        >
          📎
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
            placeholder="Type your message.."
            className="w-full px-4 py-2 bg-gray-100 border-none rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            rows={1}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
        </div>
        
        <div className="flex items-center space-x-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="hidden sm:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              😊
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 z-50">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
          </div>
          
          <button
            type="button"
            className="hidden sm:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            🎤
          </button>
          
          <button
            type="submit"
            disabled={!message.trim() && attachments.length === 0}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
