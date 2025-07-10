import React, { useState } from 'react';
import { Edit3, Check, X, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';

const QuickStatusUpdate = ({ currentUser, onStatusUpdate }) => {
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(currentUser?.status_message || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSaveStatus = async () => {
    try {
      setLoading(true);
      setError('');
      
      const updatedUser = await userService.updateStatus(token, statusMessage);
      
      if (onStatusUpdate) {
        onStatusUpdate(updatedUser);
      }
      
      setIsEditing(false);
      console.log('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setStatusMessage(currentUser?.status_message || '');
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveStatus();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center space-x-2 mb-2">
        <MessageSquare size={16} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Quick Status</span>
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="What's on your mind?"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="2"
            maxLength="200"
            disabled={loading}
          />
          
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={handleSaveStatus}
              disabled={loading}
              className="flex items-center px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Check size={12} className="mr-1" />
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex items-center px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
            >
              <X size={12} className="mr-1" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              {currentUser?.status_message || 'Set your status...'}
            </p>
          </div>
          <Edit3 size={14} className="text-gray-400" />
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-1">
        {statusMessage.length}/200 characters
      </div>
    </div>
  );
};

export default QuickStatusUpdate;
