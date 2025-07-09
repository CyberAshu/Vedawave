import React, { useState, useEffect } from 'react';
import { friendService } from '../services/friendService';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Users, Search, Check, X, MessageCircle } from 'lucide-react';

const Friends = ({ onStartChat }) => {
  const [activeTab, setActiveTab] = useState('friends'); // friends, search, requests
  const [friends, setFriends] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [apiRequests, setApiRequests] = useState([]); // For API-fetched requests
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { friendRequests: socketRequests = [] } = useSocket();
  const { user: currentUser } = useAuth();

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

  const sendFriendRequest = async (userId) => {
    try {
      await friendService.sendFriendRequest(userId);
      setSearchResults(searchResults.filter(user => user.id !== userId));
      setError(null);
      // Show success message
      alert('Friend request sent successfully!');
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
        alert('Friend request accepted!');
      } else {
        alert('Friend request rejected!');
      }
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
    const timeoutId = setTimeout(() => {
      searchUsers(query);
    }, 500);

    return () => clearTimeout(timeoutId);
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
        friends.map(friendship => (
          <div key={friendship.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border">
            <div className="flex items-center">
              {friendship.friend.avatar ? (
                <img
                  src={friendship.friend.avatar}
                  alt={friendship.friend.name}
                  className="w-10 h-10 rounded-full mr-3"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {friendship.friend.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-800">{friendship.friend.name}</p>
                <p className="text-sm text-gray-500">{friendship.friend.email}</p>
              </div>
            </div>
            <button
              onClick={() => onStartChat && onStartChat(friendship.friend.id)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <MessageCircle size={16} className="mr-1" />
              Chat
            </button>
          </div>
        ))
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
        searchResults.map(user => (
          <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border">
            <div className="flex items-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full mr-3"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.is_active && (
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                )}
              </div>
            </div>
            <button
              onClick={() => sendFriendRequest(user.id)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
            >
              <UserPlus size={16} className="mr-1" />
              Add Friend
            </button>
          </div>
        ))
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
    
    const receivedRequests = uniqueRequests.filter(req => req.receiver.id === currentUser.id && req.status === 'pending');
    const sentRequests = uniqueRequests.filter(req => req.sender.id === currentUser.id && req.status === 'pending');
    
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
              {receivedRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    {request.sender.avatar ? (
                      <img
                        src={request.sender.avatar}
                        alt={request.sender.name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {request.sender.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{request.sender.name}</p>
                      <p className="text-sm text-gray-500">{request.sender.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleFriendRequest(request.id, 'accepted')}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center"
                    >
                      <Check size={16} className="mr-1" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleFriendRequest(request.id, 'rejected')}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center"
                    >
                      <X size={16} className="mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
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
              {sentRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    {request.receiver.avatar ? (
                      <img
                        src={request.receiver.avatar}
                        alt={request.receiver.name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {request.receiver.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{request.receiver.name}</p>
                      <p className="text-sm text-gray-500">{request.receiver.email}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with tabs */}
      <div className="bg-white border-b p-3 sm:p-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'friends'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="inline mr-2" size={16} />
            Friends
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Search className="inline mr-2" size={16} />
            Find Friends
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserPlus className="inline mr-2" size={16} />
            Requests
            {(() => {
              const allRequests = [...apiRequests, ...socketRequests];
              const uniqueRequests = allRequests.filter((request, index, self) => 
                index === self.findIndex(r => r.id === request.id)
              );
              const pendingCount = uniqueRequests.filter(req => req.receiver.id === currentUser.id && req.status === 'pending').length;
              return pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              );
            })()}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
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
