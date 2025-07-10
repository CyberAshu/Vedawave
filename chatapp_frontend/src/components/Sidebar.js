import React, { useState } from 'react';
import { MessageCircle, Users, User, Trash2, Check, X } from 'lucide-react';
import Friends from './Friends';
import Badge from './Badge';
import ProfileModal from './ProfileModal';
import chatService from '../services/chatService';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ chats, selectedChat, onChatSelect, onNewChat, users, currentUser, onProfileClick, onStartChat, onChatsUpdate }) => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeTab, setActiveTab] = useState('chats'); // chats or friends
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Context menu and multi-select states
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, chatId: null });
  const [selectedChats, setSelectedChats] = useState(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // 'single' or 'multiple'
  const [deletingChats, setDeletingChats] = useState(false);
  const [selectedChatIdForDeletion, setSelectedChatIdForDeletion] = useState(null);

  const filteredChats = (chats || []).filter(chat =>
    chat.other_user && chat.other_user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvatarColor = (name) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const handleStartChat = async (friendId) => {
    try {
      const existingChat = chats.find(chat => chat.other_user.id === friendId);
      if (existingChat) {
        onChatSelect(existingChat);
      } else {
        await onNewChat(friendId);
      }
      setActiveTab('chats'); // Switch to chats tab after starting a chat
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleProfileClick = (user) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
  };

  const handleMessageFromProfile = (user) => {
    setShowProfileModal(false);
    handleStartChat(user.id);
  };

  const handleViewProfile = (user) => {
    setShowProfileModal(false);
    if (user.id === currentUser.id) {
      onProfileClick(); // Open settings for current user
    } else {
      // For other users, you might want to implement a detailed profile view
      console.log('View profile for:', user.name);
    }
  };

  // Context menu handlers
  const handleRightClick = (e, chatId) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Right click on chat ID:', chatId);
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      chatId: chatId
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, chatId: null });
  };

  // Multi-select handlers
  const toggleChatSelection = (chatId) => {
    const newSelected = new Set(selectedChats);
    if (newSelected.has(chatId)) {
      newSelected.delete(chatId);
    } else {
      newSelected.add(chatId);
    }
    setSelectedChats(newSelected);
  };

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedChats(new Set());
  };

  const selectAllChats = () => {
    const allChatIds = filteredChats.map(chat => chat.id);
    setSelectedChats(new Set(allChatIds));
  };

  const clearSelection = () => {
    setSelectedChats(new Set());
  };

  // Delete handlers
  const handleDeleteSingleChat = (chatId) => {
    console.log('handleDeleteSingleChat called with chatId:', chatId);
    setDeleteTarget('single');
    setSelectedChatIdForDeletion(chatId); // Store in separate state
    setShowDeleteModal(true);
    closeContextMenu();
  };

  const handleDeleteMultipleChats = () => {
    if (selectedChats.size === 0) return;
    setDeleteTarget('multiple');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setDeletingChats(true);
    try {
      if (deleteTarget === 'single') {
        console.log('Deleting single chat with ID:', selectedChatIdForDeletion);
        if (!selectedChatIdForDeletion) {
          throw new Error('Chat ID is null or undefined');
        }
        await chatService.deleteChat(token, selectedChatIdForDeletion);
      } else if (deleteTarget === 'multiple') {
        const chatIds = Array.from(selectedChats);
        console.log('Deleting multiple chats with IDs:', chatIds);
        await chatService.deleteMultipleChats(token, chatIds);
      }
      
      // Refresh chats list
      if (onChatsUpdate) {
        await onChatsUpdate();
      }
      
      // Reset states
      setSelectedChats(new Set());
      setIsMultiSelectMode(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setSelectedChatIdForDeletion(null);
    } catch (error) {
      console.error('Error deleting chat(s):', error);
      alert('Error deleting chat(s). Please try again.');
    } finally {
      setDeletingChats(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
    setSelectedChatIdForDeletion(null);
  };

  // Click outside to close context menu
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        closeContextMenu();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.show]);

  const renderChatsTab = () => (
    <>
      {/* Search and Multi-Select Controls */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-100 border-none rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Multi-Select Controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleMultiSelectMode}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              isMultiSelectMode 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {isMultiSelectMode ? 'Exit Select' : 'Select Multiple'}
          </button>
          
          {isMultiSelectMode && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {selectedChats.size} selected
              </span>
              {selectedChats.size > 0 && (
                <button
                  onClick={handleDeleteMultipleChats}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete selected chats"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <button
                onClick={selectAllChats}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="mx-auto mb-2" size={40} />
            <p>No chats yet</p>
            <p className="text-sm">Add friends to start chatting!</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                selectedChat?.id === chat.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
              } ${
                selectedChats.has(chat.id) ? 'bg-blue-100' : ''
              }`}
              onContextMenu={(e) => handleRightClick(e, chat.id)}
            >
              {/* Multi-Select Checkbox */}
              {isMultiSelectMode && (
                <div className="mr-3">
                  <input
                    type="checkbox"
                    checked={selectedChats.has(chat.id)}
                    onChange={() => toggleChatSelection(chat.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div 
                className="relative cursor-pointer"
                onClick={() => handleProfileClick(chat.other_user)}
              >
                {chat.other_user.avatar ? (
                  <img
                    src={chat.other_user.avatar}
                    alt={chat.other_user.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-full ${getAvatarColor(chat.other_user.name)} flex items-center justify-center text-white font-medium`}>
                    {chat.other_user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {chat.other_user.is_active && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>

              <div 
                className="ml-3 flex-1 min-w-0"
                onClick={() => {
                  if (isMultiSelectMode) {
                    toggleChatSelection(chat.id);
                  } else {
                    onChatSelect(chat);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {chat.other_user.name}
                  </h3>
                  {chat.last_message && (
                    <span className="text-xs text-gray-500">
                      {new Date(chat.last_message.created_at + 'Z').toLocaleTimeString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 truncate">
                    {chat.last_message ? (
                      chat.last_message.message_type === 'text'
                        ? chat.last_message.content
                        : `File: ${chat.last_message.message_type}`
                    ) : (
                      'No messages yet'
                    )}
                  </p>
                  {chat.other_user.is_active && (
                    <span className="text-xs text-green-500 font-medium">Active</span>
                  )}
                </div>
                {chat.unread_count > 0 && (
                    <Badge count={chat.unread_count} />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800">VedaWave</h1>
        <button
          onClick={onProfileClick}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          title="Profile Settings"
        >
          <User size={20} />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'chats'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageCircle className="inline mr-2" size={16} />
          Chats
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'friends'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="inline mr-2" size={16} />
          Friends
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'chats' && renderChatsTab()}
      {activeTab === 'friends' && (
        <Friends onStartChat={handleStartChat} onProfileClick={handleProfileClick} />
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Start New Chat</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    onNewChat(user.id);
                    setShowNewChatModal(false);
                  }}
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white font-medium`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  {user.is_active && (
                    <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              console.log('Context menu delete clicked, chatId:', contextMenu.chatId);
              handleDeleteSingleChat(contextMenu.chatId);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
          >
            <Trash2 size={16} className="mr-2" />
            Delete Chat
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <div className="flex items-center mb-4">
              <Trash2 className="text-red-500 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Chat{deleteTarget === 'multiple' && selectedChats.size > 1 ? 's' : ''}
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              {deleteTarget === 'single' 
                ? 'Are you sure you want to delete this chat? This will permanently remove all messages and cannot be undone.'
                : `Are you sure you want to delete ${selectedChats.size} chat${selectedChats.size > 1 ? 's' : ''}? This will permanently remove all messages and cannot be undone.`
              }
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                disabled={deletingChats}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingChats}
                className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center"
              >
                {deletingChats ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          user={selectedUser}
          currentUser={currentUser}
          onClose={handleCloseProfileModal}
          onMessageClick={handleMessageFromProfile}
          onViewProfile={handleViewProfile}
        />
      )}
    </div>
  );
};

export default Sidebar;
