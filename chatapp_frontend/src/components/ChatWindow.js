import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import MessageInput from './MessageInput';
import chatService from '../services/chatService';
import { useAuth } from '../context/AuthContext';


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const FILE_BASE_URL = process.env.REACT_APP_FILE_BASE_URL;


const ChatWindow = ({ chat, currentUser, token, onShowSidebar, onBackClick }) => {
  const { messages, typingUsers, sendMessage, setMessages } = useSocket();
  const { user } = useAuth();
  const actualCurrentUser = user || currentUser;
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const messages = await chatService.getMessages(token, chat.id);
        setChatMessages(messages);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [chat, token]);

  useEffect(() => {
    setMessages(chatMessages);
  }, [chatMessages, setMessages]);

  // Update chatMessages when new messages come from socket
  useEffect(() => {
    const newMessages = messages.filter(msg => 
      msg.chat_id === chat.id && 
      !chatMessages.find(existingMsg => existingMsg.id === msg.id)
    );
    
    if (newMessages.length > 0) {
      setChatMessages(prev => [...prev, ...newMessages]);
    }
  }, [messages, chat.id, chatMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Listen for message deletion events
  useEffect(() => {
    const handleMessageDeleted = (event) => {
      const { messageId } = event.detail;
      setChatMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, is_deleted: true, content: 'This message was deleted' }
          : msg
      ));
    };

    const handleMessageEdited = (event) => {
      const { messageId, content, is_edited } = event.detail;
      setChatMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content, is_edited }
          : msg
      ));
    };

    const handleMessageReaction = (event) => {
      const { messageId, reactions } = event.detail;
      setChatMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions }
          : msg
      ));
    };

    window.addEventListener('messageDeleted', handleMessageDeleted);
    window.addEventListener('messageEdited', handleMessageEdited);
    window.addEventListener('messageReaction', handleMessageReaction);
    
    return () => {
      window.removeEventListener('messageDeleted', handleMessageDeleted);
      window.removeEventListener('messageEdited', handleMessageEdited);
      window.removeEventListener('messageReaction', handleMessageReaction);
    };
  }, []);

  const handleSendMessage = (content, messageType, attachments) => {
    const messageData = {
      content,
      chatId: chat.id,
      messageType,
      attachments,
      replyToMessageId: replyToMessage?.id || null
    };
    sendMessage(messageData.content, messageData.chatId, messageData.messageType, messageData.attachments, messageData.replyToMessageId);
    setReplyToMessage(null); // Clear reply after sending
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Message will be updated via WebSocket broadcast
        setOpenMenuId(null);
      } else {
        console.error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReplyToMessage = (message) => {
    setReplyToMessage(message);
    setOpenMenuId(null);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const handleEditMessage = (messageId) => {
    const messageToEdit = chatMessages.find((msg) => msg.id === messageId);
    if (messageToEdit) {
      setEditingMessageId(messageId);
      setEditContent(messageToEdit.content);
    }
    setOpenMenuId(null);
  };

  const handleSaveEdit = async () => {
    try {
      await chatService.editMessage(token, editingMessageId, editContent);
      // Message will be updated via WebSocket broadcast
      setEditingMessageId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [commonEmojis] = useState(['👍', '❤️', '😂', '😢', '😮', '😡', '👎', '🎉']);


  const handleEmojiReaction = async (messageId, emoji) => {
    try {
      await chatService.addReaction(token, messageId, emoji);
      // Reaction will be updated via WebSocket broadcast
      setShowEmojiPicker(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center p-4 border-b border-gray-200">
        {/* Mobile Back Button */}
        <button
          onClick={onBackClick}
          className="md:hidden mr-3 p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* User Avatar */}
        <div className="mr-3">
          {chat.other_user.avatar ? (
            <img
              src={chat.other_user.avatar}
              alt={chat.other_user.name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {chat.other_user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800">
            {chat.other_user.name}
          </h2>
          <span className="text-sm text-gray-500">
            {chat.other_user.is_active ? 'Online' : 'Offline'}
          </span>
        </div>
        
        {/* Mobile Menu Button */}
        <button
          onClick={onShowSidebar}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Reply Preview */}
      {replyToMessage && (
        <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm text-gray-600">Replying to:</div>
              <div className="text-sm font-medium text-gray-800 truncate">
                {replyToMessage.content}
              </div>
            </div>
            <button
              onClick={handleCancelReply}
              className="ml-2 p-1 hover:bg-gray-200 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <p className="text-gray-600">Loading messages...</p>
        ) : (
          Object.entries(chatMessages.reduce((acc, message) => {
            const messageDate = new Date(message.created_at).toDateString();
            if(!acc[messageDate]){
              acc[messageDate] = [];
            }
            acc[messageDate].push(message);
            return acc;
          }, {})).map(([date, messages]) => (
            <div key={date}>
              <div className="text-center text-gray-500 text-sm font-medium mb-3 mt-2">
                <span className="bg-gray-100 px-3 py-1 rounded-full">
                  {date === new Date().toDateString() ? 'Today' : 
                   date === new Date(Date.now() - 86400000).toDateString() ? 'Yesterday' : 
                   new Date(date).toLocaleDateString('en-US', { 
                     weekday: 'long', 
                     year: 'numeric', 
                     month: 'long', 
                     day: 'numeric' 
                   })}
                </span>
              </div>
              <div className="space-y-4">
                {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === actualCurrentUser.id ? 'justify-end' : 'justify-start'}`}
                      onMouseEnter={() => setHoveredMessage(message.id)}
                      onMouseLeave={() => setHoveredMessage(null)}
                    >
                  <div className="relative group max-w-xs lg:max-w-md">
                {/* Reply indicator */}
                {message.reply_to_message && (
                  <div className="mb-1 text-xs text-gray-500 px-2">
                    <div className="border-l-2 border-gray-300 pl-2">
                      Replying to: {message.reply_to_message.content?.substring(0, 50)}...
                    </div>
                  </div>
                )}
                
                <div
  className={`flex flex-col space-y-1 ${
    message.sender_id === actualCurrentUser.id
      ? 'bg-blue-500 text-white'
      : 'bg-gray-200 text-gray-800'
  } p-2 rounded-lg relative`}
>

                  <div>
                    {message.is_deleted ? (
                      <em className="text-gray-600 italic opacity-75 bg-gray-100 px-2 py-1 rounded border border-gray-300">
                        This message was deleted
                      </em>
                    ) : editingMessageId === message.id ? (
                      <div className="space-y-2 w-full">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white min-h-[60px]"
                          rows={2}
                          autoFocus
                          style={{
                            color: '#111827',
                            backgroundColor: '#ffffff',
                            fontSize: '14px',
                            lineHeight: '1.5'
                          }}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="break-words">
                        {/* Display message content */}
                        {message.content && (
                          <div className="mb-2">
                            {message.content}
                          </div>
                        )}
                        
                        {/* Display attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="space-y-2">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="attachment">
                                {attachment.file_type && attachment.file_type.startsWith('image/') ? (
                                  <div className="image-attachment">
                                    <img 
                                      src={`${FILE_BASE_URL}${attachment.file_url}`}
                                      alt={attachment.filename}
                                      className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => {
                                        // Open image in new tab
                                        window.open(`${FILE_BASE_URL}${attachment.file_url}`, '_blank');
                                      }}
                                    />
                                    <div className={`text-xs mt-1 px-2 py-1 rounded ${
                                      message.sender_id === actualCurrentUser.id
                                        ? 'bg-blue-600 text-blue-100'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {attachment.filename}
                                    </div>
                                  </div>
                                ) : (
                                  <div className={`file-attachment p-2 rounded border flex items-center space-x-2 ${
                                    message.sender_id === actualCurrentUser.id
                                      ? 'bg-blue-400 border-blue-400 text-white'
                                      : 'bg-gray-100 border-gray-300 text-gray-800'
                                  }`}>
                                    <svg className={`w-5 h-5 ${
                                      message.sender_id === actualCurrentUser.id
                                        ? 'text-blue-200'
                                        : 'text-gray-500'
                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium">{attachment.filename}</div>
                                      <div className={`text-xs ${
                                        message.sender_id === actualCurrentUser.id
                                          ? 'text-blue-200'
                                          : 'text-gray-500'
                                      }`}>
                                        {attachment.file_size ? `${Math.round(attachment.file_size / 1024)} KB` : 'Unknown size'}
                                      </div>
                                    </div>
                                    <a 
                                      href={`${FILE_BASE_URL}${attachment.file_url}`}
                                      download={attachment.filename}
                                      className={`text-sm underline ${
                                        message.sender_id === actualCurrentUser.id
                                          ? 'text-blue-200 hover:text-white'
                                          : 'text-blue-500 hover:text-blue-700'
                                      }`}
                                    >
                                      Download
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-xs opacity-70 self-end">
                    {new Date(message.created_at).toLocaleTimeString()}
                    {message.is_edited && <span className="ml-1">(edited)</span>}
                  </div>
                </div>
                
                {/* Reactions displayed outside message bubble */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1 ${message.sender_id === actualCurrentUser.id ? 'justify-end' : 'justify-start'}`}>
                    {message.reactions.map((reaction, index) => {
                      const hasUserReacted = reaction.users.includes(actualCurrentUser.id);
                      return (
                        <button
                          key={index}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs cursor-pointer transition-all duration-200 border ${
                            hasUserReacted
                              ? 'bg-blue-100 border-blue-300 text-blue-800 shadow-sm'
                              : 'bg-gray-50 hover:bg-gray-100 border-gray-300 text-gray-700 hover:shadow-sm'
                          }`}
                          title={`${reaction.users.map(userId => userId === actualCurrentUser.id ? 'You' : `User ${userId}`).join(', ')} reacted`}
                          onClick={() => handleEmojiReaction(message.id, reaction.emoji)}
                        >
                          <span className="mr-1">{reaction.emoji}</span>
                          <span className="font-medium">{reaction.count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Horizontal Reaction Bar */}
                {hoveredMessage === message.id && !message.is_deleted && (
                  <div className={`absolute -top-6 ${message.sender_id === actualCurrentUser.id ? 'right-0' : 'left-0'} bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1 z-10`}>
                    <div className="flex items-center space-x-1">
                      {/* Quick Reaction Emojis */}
                      <button
                        onClick={() => handleEmojiReaction(message.id, '👍')}
                        className="p-1 hover:bg-gray-100 rounded-full text-sm transition-colors"
                        title="Like"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleEmojiReaction(message.id, '❤️')}
                        className="p-1 hover:bg-gray-100 rounded-full text-sm transition-colors"
                        title="Love"
                      >
                        ❤️
                      </button>
                      <button
                        onClick={() => handleEmojiReaction(message.id, '😂')}
                        className="p-1 hover:bg-gray-100 rounded-full text-sm transition-colors"
                        title="Laugh"
                      >
                        😂
                      </button>
                      <button
                        onClick={() => handleEmojiReaction(message.id, '😮')}
                        className="p-1 hover:bg-gray-100 rounded-full text-sm transition-colors"
                        title="Surprised"
                      >
                        😮
                      </button>
                      
                      {/* More Emojis Button */}
                      <button
                        onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                        className="p-1 hover:bg-gray-100 rounded-full text-sm transition-colors"
                        title="More reactions"
                      >
                        ➕
                      </button>
                      
                      {/* Separator */}
                      <div className="w-px h-4 bg-gray-300 mx-1"></div>
                      
                      {/* Reply Button */}
                      <button
                        onClick={() => handleReplyToMessage(message)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Reply"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                      
                      {/* More Options Button - Only for own messages */}
                      {message.sender_id === actualCurrentUser.id && (
                        <button
                          onClick={() => setOpenMenuId(openMenuId === message.id ? null : message.id)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          title="More options"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Dropdown menu for more options */}
                {openMenuId === message.id && (
                  <div className={`absolute top-8 ${message.sender_id === actualCurrentUser.id ? 'right-0' : 'left-0'} bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 min-w-[140px]`}>
                    {/* Reply option for all messages */}
                    <button
                      onClick={() => handleReplyToMessage(message)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Reply
                    </button>
                    
                    {/* Edit and Delete for own messages only */}
                    {message.sender_id === actualCurrentUser.id && (
                      <>
                        <button 
                          onClick={() => handleEditMessage(message.id)} 
                          className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        
                        <button 
                          onClick={() => {
                            handleDeleteMessage(message.id);
                            setOpenMenuId(null);
                          }} 
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center border-t border-gray-100"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
                
                {/* Extended Emoji Picker */}
                {showEmojiPicker === message.id && (
                  <div className={`absolute top-0 ${message.sender_id === actualCurrentUser.id ? 'right-0' : 'left-0'} bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-30 flex flex-wrap gap-1 max-w-xs`}>
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => handleEmojiReaction(message.id, emoji)}
                        className="p-1 hover:bg-gray-100 rounded text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <MessageInput onSendMessage={handleSendMessage} chatId={chat.id} />
        {typingUsers[chat.id] && (
          <div className="text-sm text-gray-500">
            {Object.entries(typingUsers[chat.id])
              .filter(([, isTyping]) => isTyping)
              .map(([userId]) => {
                // Show the other user's name since they're typing
                const userName = userId === String(chat.other_user.id) ? chat.other_user.name : 'Someone';
                return (
                  <span key={userId}>{userName} is typing...</span>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;