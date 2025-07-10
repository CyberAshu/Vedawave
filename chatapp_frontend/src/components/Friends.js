import React, { useState, useEffect } from 'react';
import { friendService } from '../services/friendService';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Users, Search, Check, X, MessageCircle } from 'lucide-react';

const Friends = ({ onStartChat, onProfileClick }) => {
  const [activeTab, setActiveTab] = useState('friends'); // friends, search, requests
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [apiRequests, setApiRequests] = useState([]); // For API-fetched requests
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { friendRequests: socketRequests = [] } = useSocket();
  const { user: currentUser } = useAuth();
  
  const getAvatarColor = (name) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  useEffect(() => {
    if (activeTab === 'friends') {
      loadFriends();
    } else if (activeTab === 'requests') {
      loadFriendRequests();
    }
  }, [activeTab]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const data = await friendService.getFriends();
      setFriends(data);
    } catch (error) {
      setError('Failed to load friends');
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      setLoading(true);
      const data = await friendService.getFriendRequests();
      setApiRequests(data);
    } catch (error) {
      setError('Failed to load friend requests');
      console.error('Error loading friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const data = await friendService.searchUsers(query);
      setSearchResults(data);
    } catch (error) {
      setError('Failed to search users');
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const [successMessage, setSuccessMessage] = useState('');
  
  const sendFriendRequest = async (userId) => {
    try {
      await friendService.sendFriendRequest(userId);
      setSearchResults(searchResults.filter(user => user.id !== userId));
      setError(null);
      setSuccessMessage('Friend request sent successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Failed to send friend request');
      console.error('Error sending friend request:', error);
    }
  };

  const handleFriendRequest = async (requestId, status) => {
    try {
      await friendService.updateFriendRequest(requestId, status);
      setApiRequests(apiRequests.filter(req => req.id !== requestId));
      if (status === 'accepted') {
        loadFriends(); // Reload friends list
        setSuccessMessage('Friend request accepted!');
      } else {
        setSuccessMessage('Friend request rejected!');
      }
      setTimeout(() => setSuccessMessage(''), 3000);
      setError(null);
    } catch (error) {
      setError(`Failed to ${status} friend request`);
      console.error('Error handling friend request:', error);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    setTimeout(() => {
      searchUsers(query);
    }, 500);
  };


  const renderFriendsList = () => (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Users className="mr-2" size={20} />
        My Friends ({friends.length})
      </h3>
      {loading ? (
        <div className="text-center py-8">Loading friends...</div>
      ) : friends.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="mx-auto mb-2" size={40} />
          <p>No friends yet. Start by searching and adding friends!</p>
        </div>
      ) : (
        friends.map(friendship => {
          const avatarColor = getAvatarColor(friendship.friend.name);
          return (
            <div key={friendship.id} className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center flex-1 min-w-0">
                <div 
                  className="relative flex-shrink-0 cursor-pointer"
                  onClick={() => onProfileClick && onProfileClick(friendship.friend)}
                >
                  {friendship.friend.avatar ? (
                    <img
                      src={friendship.friend.avatar}
                      alt={friendship.friend.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-medium`}>
                      {friendship.friend.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {friendship.friend.is_active && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{friendship.friend.name}</p>
                  <p className="text-sm text-gray-500 truncate">{friendship.friend.email}</p>
                  {friendship.friend.is_active && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                      Online
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onStartChat && onStartChat(friendship.friend.id)}
                className="ml-3 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center text-sm flex-shrink-0"
              >
                <MessageCircle size={14} className="mr-1" />
                Chat
              </button>
            </div>
          );
        })
      )}
    </div>
  );

  const renderSearchUsers = () => (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Search className="mr-2" size={20} />
        Find Friends
      </h3>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Searching...</div>
      ) : searchResults.length === 0 && searchQuery ? (
        <div className="text-center py-8 text-gray-500">
          <Search className="mx-auto mb-2" size={40} />
          <p>No users found matching "{searchQuery}"</p>
        </div>
      ) : (
        searchResults.map(user => {
          const avatarColor = getAvatarColor(user.name);
          return (
            <div key={user.id} className="flex items-center p-3 bg-white rounded-lg shadow-sm border">
              <div className="flex items-center flex-1 min-w-0">
                <div 
                  className="flex-shrink-0 cursor-pointer"
                  onClick={() => onProfileClick && onProfileClick(user)}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-medium`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{user.name}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  {user.is_active && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                      Online
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => sendFriendRequest(user.id)}
                className="ml-3 px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center text-sm flex-shrink-0"
              >
                <UserPlus size={14} className="mr-1" />
                Add
              </button>
            </div>
          );
        })
      )}
    </div>
  );

  const renderFriendRequests = () => {
    // Combine API requests and socket requests
    const allRequests = [...apiRequests, ...socketRequests];
    // Remove duplicates based on id
    const uniqueRequests = allRequests.filter((request, index, self) => 
      index === self.findIndex(r => r.id === request.id)
    );
    
    console.log('Current User:', currentUser);
    console.log('All Friend Requests:', uniqueRequests);
    
    const receivedRequests = uniqueRequests.filter(req => req.receiver?.id === currentUser?.id && req.status === 'pending');
    const sentRequests = uniqueRequests.filter(req => req.sender?.id === currentUser?.id && req.status === 'pending');
    
    console.log('Received Requests:', receivedRequests);
    console.log('Sent Requests:', sentRequests);

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Friend Requests</h3>
        
        {/* Received Requests */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Received ({receivedRequests.length})</h4>
          {receivedRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending friend requests</p>
          ) : (
            <div className="space-y-3">
              {receivedRequests.map(request => {
                const avatarColor = getAvatarColor(request.sender.name);
                return (
                  <div key={request.id} className="flex items-center p-3 bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center flex-1 min-w-0">
                      <div 
                        className="flex-shrink-0 cursor-pointer"
                        onClick={() => onProfileClick && onProfileClick(request.sender)}
                      >
                        {request.sender.avatar ? (
                          <img
                            src={request.sender.avatar}
                            alt={request.sender.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-medium`}>
                            {request.sender.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{request.sender.name}</p>
                        <p className="text-sm text-gray-500 truncate">{request.sender.email}</p>
                      </div>
                    </div>
                    <div className="ml-3 flex space-x-2 flex-shrink-0">
                      <button
                        onClick={() => handleFriendRequest(request.id, 'accepted')}
                        className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center text-xs"
                      >
                        <Check size={12} className="mr-1" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleFriendRequest(request.id, 'rejected')}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center text-xs"
                      >
                        <X size={12} className="mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sent Requests */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Sent ({sentRequests.length})</h4>
          {sentRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending sent requests</p>
          ) : (
            <div className="space-y-3">
              {sentRequests.map(request => {
                const avatarColor = getAvatarColor(request.receiver.name);
                return (
                  <div key={request.id} className="flex items-center p-3 bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center flex-1 min-w-0">
                      <div 
                        className="flex-shrink-0 cursor-pointer"
                        onClick={() => onProfileClick && onProfileClick(request.receiver)}
                      >
                        {request.receiver.avatar ? (
                          <img
                            src={request.receiver.avatar}
                            alt={request.receiver.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-medium`}>
                            {request.receiver.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{request.receiver.name}</p>
                        <p className="text-sm text-gray-500 truncate">{request.receiver.email}</p>
                      </div>
                    </div>
                    <span className="ml-3 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex-shrink-0">
                      Pending
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex bg-gray-50">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-200 flex items-center justify-center ${
              activeTab === 'friends'
                ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Users className="mr-2" size={16} />
            Friends
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-200 flex items-center justify-center ${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Search className="mr-2" size={16} />
            Find
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all duration-200 flex items-center justify-center relative ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <UserPlus className="mr-2" size={16} />
            Requests
            {(() => {
              const allRequests = [...apiRequests, ...socketRequests];
              const uniqueRequests = allRequests.filter((request, index, self) => 
                index === self.findIndex(r => r.id === request.id)
              );
              const pendingCount = uniqueRequests.filter(req => req.receiver?.id === currentUser?.id && req.status === 'pending').length;
              return pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              );
            })()}
          </button>
        </div>
      </div>

      {/* Error and Success messages */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'friends' && renderFriendsList()}
        {activeTab === 'search' && renderSearchUsers()}
        {activeTab === 'requests' && renderFriendRequests()}
      </div>
    </div>
  );
};

export default Friends;
