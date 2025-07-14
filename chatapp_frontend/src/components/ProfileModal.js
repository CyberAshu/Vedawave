import React from 'react';
import { X, Info, MessageCircle, User, Mail, Clock, Activity } from 'lucide-react';

const ProfileModal = ({ user, currentUser, onClose, onMessageClick, onViewProfile }) => {
  if (!user) return null;

  const getAvatarColor = (name) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const isCurrentUser = currentUser && user.id === currentUser.id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className={`w-24 h-24 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white text-3xl font-bold`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              {user.is_active && (
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
              )}
            </div>

            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-1">{user.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">{user.email}</p>
            
            {/* Status */}
            <div className="flex items-center space-x-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className={`text-sm font-medium ${user.is_active ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {user.is_active ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Activity className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.is_active ? 'Currently active' : 'Last seen recently'}
                </p>
                {user.status_message && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
                    "{user.status_message}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Member since</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
                </p>
              </div>
            </div>

            {/* Custom Status Message */}
            {user.status_message && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20  rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="w-5 h-5 text-blue-500 dark:text-blue-400 flex items-center justify-center">
                  💬
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 ">Custom Status</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {user.status_message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {!isCurrentUser && (
              <>
                <button
                  onClick={() => onMessageClick && onMessageClick(user)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-400 transition-colors"
                >
                  <MessageCircle size={16} className="mr-2" />
                  Message
                </button>
                <button
                  onClick={() => onViewProfile && onViewProfile(user)}
                  className="flex items-center justify-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-400 transition-colors"
                  title="View full profile"
                >
                  <Info size={16} />
                </button>
              </>
            )}
            {isCurrentUser && (
              <button
                onClick={() => onViewProfile && onViewProfile(user)}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-400 transition-colors"
              >
                <User size={16} className="mr-2" />
                View My Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
