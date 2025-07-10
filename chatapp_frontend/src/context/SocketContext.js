import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';
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
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const { token, user } = useAuth();

  useEffect(() => {
    let ws;
    let interval;
    
    const connectWebSocket = () => {
      if (!token || !user) return;
      
      console.log('Attempting to connect WebSocket...');
      ws = new WebSocket(`${WS_BASE_URL}/${token}`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setSocket(ws);
        setReconnectAttempts(0);
        
        // Start heartbeat
        interval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Send ping every 30 seconds
      };
      
      ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            setMessages(prev => [...prev, data.message]);
            
            // Show notification for new message if user is not focused on the current chat
            if (!notificationService.isUserFocusedOnChat(data.message.chat_id)) {
              notificationService.showMessageNotification(
                data.sender || { name: 'Someone', id: data.message.sender_id },
                data.message.content,
                data.message.chat_id
              );
            }
            
            // Trigger chat list refresh for unread count update
            window.dispatchEvent(new CustomEvent('newMessage', { detail: { chatId: data.message.chat_id } }));
          } else if (data.type === 'message_status') {
            // Handle message status updates (delivered, seen)
            console.log('Received message status update:', data);
            setMessages(prev => {
              const updated = prev.map(msg => 
                msg.id === data.message_id 
                  ? { ...msg, status: data.status }
                  : msg
              );
              console.log('Updated messages in context:', updated.find(m => m.id === data.message_id));
              return updated;
            });
            // Trigger event for ChatWindow to update the message status in real-time
            window.dispatchEvent(new CustomEvent('messageStatusUpdate', { 
              detail: { 
                messageId: data.message_id, 
                status: data.status,
                chatId: data.chat_id
              } 
            }));
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
              
              // Show notification using notification service
              notificationService.showFriendRequestNotification(
                data.request.sender || { name: 'Someone', id: data.request.sender_id }
              );
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
          } else if (data.type === 'pong') {
            // Handle pong response (heartbeat acknowledgment)
            console.log('Received pong from server');
          }
        };
        
      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event);
        setConnected(false);
        setSocket(null);
        
        // Clear heartbeat
        if (interval) {
          clearInterval(interval);
        }
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && event.code !== 1001 && reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff
          console.log(`Attempting to reconnect in ${delay}ms... (attempt ${reconnectAttempts + 1}/5)`);
          
          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
          }, delay);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };
    
    if (token && user) {
      connectWebSocket();
    }
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close(1000); // Normal closure
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [token, user, reconnectAttempts]);

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
