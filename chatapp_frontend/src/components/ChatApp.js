import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import chatService from '../services/chatService';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import Settings from './Settings';

const ChatApp = () => {
  const { user, token, logout } = useAuth();
  const { connected } = useSocket();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false); // For mobile sidebar toggle
  const [showSettings, setShowSettings] = useState(false); // For settings view

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [chatsData, usersData] = await Promise.all([
          chatService.getChats(token),
          chatService.getUsers(token)
        ]);
        
        setChats(chatsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadInitialData();
    }
  }, [token]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    // Close sidebar on mobile when chat is selected
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleNewChat = async (userId) => {
    try {
      const newChat = await chatService.createChat(token, userId);
      setChats(prev => [newChat, ...prev]);
      setSelectedChat(newChat);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleProfileClick = () => {
    setShowSettings(true);
    setSelectedChat(null);
    // Close sidebar on mobile when profile is clicked
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleBackFromSettings = () => {
    setShowSettings(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-xl text-gray-600">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:relative
        fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out z-50 md:z-auto
      `}>
        <Sidebar
          chats={chats}
          selectedChat={selectedChat}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          users={users}
          currentUser={user}
          onProfileClick={handleProfileClick}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {showSettings ? (
          <Settings
            currentUser={user}
            onLogout={logout}
            onBackClick={handleBackFromSettings}
          />
        ) : selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            currentUser={user}
            token={token}
            onShowSidebar={() => setShowSidebar(true)}
            onBackClick={() => setSelectedChat(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-800">VedaWave</h1>
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            {/* Welcome Screen */}
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center px-4">
                <div className="text-6xl text-gray-300 mb-4">💬</div>
                <h2 className="text-2xl font-semibold text-gray-600 mb-2">
                  Welcome to VedaWave
                </h2>
                <p className="text-gray-500 mb-4">
                  {window.innerWidth < 768 ? 'Tap the menu to start chatting' : 'Select a chat to start messaging'}
                </p>
                <button
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Open Chats
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connection Status */}
      {!connected && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-60">
          Disconnected - Trying to reconnect...
        </div>
      )}
    </div>
  );
};

export default ChatApp;
