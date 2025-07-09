import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL;

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user) {
      const ws = new WebSocket(`${WS_BASE_URL}/${token}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setSocket(ws);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'message') {
          setMessages(prev => [...prev, data.message]);
        } else if (data.type === 'message_deleted') {
          // Handle message deletion - update both messages state and trigger re-render
          setMessages(prev => prev.map(msg => 
            msg.id === data.message_id 
              ? { ...msg, is_deleted: true, content: 'This message was deleted' }
              : msg
          ));
          // Also trigger a manual update for any chat that might be displaying these messages
          window.dispatchEvent(new CustomEvent('messageDeleted', { detail: { messageId: data.message_id } }));
        } else if (data.type === 'message_edited') {
          // Handle message edit - update both messages state and trigger re-render
          setMessages(prev => prev.map(msg => 
            msg.id === data.message_id 
              ? { ...msg, content: data.content, is_edited: true }
              : msg
          ));
          // Also trigger a manual update for any chat that might be displaying these messages
          window.dispatchEvent(new CustomEvent('messageEdited', { 
            detail: { 
              messageId: data.message_id, 
              content: data.content, 
              is_edited: true 
            } 
          }));
        } else if (data.type === 'reaction') {
          // Handle message reaction - update both messages state and trigger re-render
          setMessages(prev => prev.map(msg => 
            msg.id === data.message_id 
              ? { ...msg, reactions: data.reactions }
              : msg
          ));
          // Also trigger a manual update for any chat that might be displaying these messages
          window.dispatchEvent(new CustomEvent('messageReaction', { 
            detail: { 
              messageId: data.message_id, 
              reactions: data.reactions 
            } 
          }));
        } else if (data.type === 'friend_request') {
          // Handle friend request notification
          if (data.action === 'received') {
            setFriendRequests(prev => [...prev, data.request]);
            // Show notification
            if (window.Notification && Notification.permission === 'granted') {
              new Notification('New Friend Request', {
                body: `${data.request.sender.name} sent you a friend request`,
                icon: '/icon-192x192.png'
              });
            }
          }
        } else if (data.type === 'typing') {
          setTypingUsers(prev => ({
            ...prev,
            [data.chat_id]: {
              ...prev[data.chat_id],
              [data.user_id]: data.is_typing
            }
          }));
          
          if (data.is_typing) {
            setTimeout(() => {
              setTypingUsers(prev => ({
                ...prev,
                [data.chat_id]: {
                  ...prev[data.chat_id],
                  [data.user_id]: false
                }
              }));
            }, 3000);
          }
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        setSocket(null);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }
  }, [token, user]);

  const sendMessage = (content, chatId, messageType = 'text', attachments = [], replyToMessageId = null) => {
    if (socket && connected) {
      const messageData = {
        type: 'message',
        content,
        chat_id: chatId,
        message_type: messageType,
        attachments,
        reply_to_message_id: replyToMessageId
      };
      
      socket.send(JSON.stringify(messageData));
    }
  };

  const sendTypingIndicator = (chatId, isTyping) => {
    if (socket && connected) {
      const typingData = {
        type: 'typing',
        chat_id: chatId,
        is_typing: isTyping
      };
      
      socket.send(JSON.stringify(typingData));
    }
  };

  const value = {
    socket,
    connected,
    messages,
    typingUsers,
    friendRequests,
    sendMessage,
    sendTypingIndicator,
    setMessages,
    setFriendRequests
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
