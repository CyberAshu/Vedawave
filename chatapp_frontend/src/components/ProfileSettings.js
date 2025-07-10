import React, { useState, useRef, useEffect } from 'react';
import { 
  Edit3, Save, X, Camera, LogOut, User, Shield, Mail, Calendar, Activity, 
  MapPin, Phone, Link, Github, Twitter, Linkedin, Globe, Check, AlertCircle, 
  Eye, EyeOff, Bell, Lock, Trash2, Download, Upload, Settings as SettingsIcon,
  Star, Award, Clock, MessageCircle, Users, Image, Video, File, Music
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';

const ProfileSettings = ({ currentUser, onLogout, onBackClick }) => {
  const { token } = useAuth();
  const { connected } = useSocket();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [editedProfile, setEditedProfile] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    avatar: currentUser?.avatar || '',
    statusMessage: currentUser?.status_message || '',
    bio: currentUser?.bio || '',
    location: currentUser?.location || '',
    website: currentUser?.website || '',
    github: currentUser?.github || '',
    twitter: currentUser?.twitter || '',
    linkedin: currentUser?.linkedin || '',
    phone: currentUser?.phone || '',
    company: currentUser?.company || '',
    position: currentUser?.position || ''
  });
  
  const [preferences, setPreferences] = useState({
    notifications: {
      messages: true,
      mentions: true,
      friendRequests: true,
      email: false,
      push: true,
      sounds: true
    },
    privacy: {
      profileVisibility: 'friends',
      onlineStatus: true,
      lastSeen: true,
      readReceipts: true
    },
    appearance: {
      theme: 'light',
      fontSize: 'medium',
      language: 'en'
    }
  });
  
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const getAvatarColor = (name) => {
    const colors = [
      'bg-gradient-to-br from-red-400 to-red-600',
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-teal-400 to-teal-600'
    ];
    const index = name?.length % colors.length || 0;
    return colors[index];
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      setError('');
      
      const updateData = {
        name: editedProfile.name,
        email: editedProfile.email,
        avatar: editedProfile.avatar,
        status_message: editedProfile.statusMessage,
        bio: editedProfile.bio,
        location: editedProfile.location,
        website: editedProfile.website,
        github: editedProfile.github,
        twitter: editedProfile.twitter,
        linkedin: editedProfile.linkedin,
        phone: editedProfile.phone,
        company: editedProfile.company,
        position: editedProfile.position
      };
      
      await userService.updateProfile(token, updateData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setAvatarPreview(null);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      try {
        setLoading(true);
        setUploadProgress(0);
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 100);
        
        const updatedUser = await userService.uploadAvatar(token, file);
        setEditedProfile({ ...editedProfile, avatar: updatedUser.avatar });
        setUploadProgress(100);
        setSuccess('Avatar uploaded successfully!');
        
        setTimeout(() => {
          setUploadProgress(0);
          clearInterval(progressInterval);
        }, 1000);
        
      } catch (error) {
        console.error('Error uploading avatar:', error);
        setError('Failed to upload avatar. Please try again.');
        setAvatarPreview(null);
        setUploadProgress(0);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      avatar: currentUser?.avatar || '',
      statusMessage: currentUser?.status_message || '',
      bio: currentUser?.bio || '',
      location: currentUser?.location || '',
      website: currentUser?.website || '',
      github: currentUser?.github || '',
      twitter: currentUser?.twitter || '',
      linkedin: currentUser?.linkedin || '',
      phone: currentUser?.phone || '',
      company: currentUser?.company || '',
      position: currentUser?.position || ''
    });
    setAvatarPreview(null);
    setError('');
  };

  const renderGeneralTab = () => (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h3 className="text-xl sm:text-2xl font-bold">Profile Information</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center px-3 py-2 sm:px-4 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors text-sm sm:text-base"
            >
              <Edit3 className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </button>
          )}
        </div>

        {/* Avatar and Basic Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative flex-shrink-0">
            <div className="relative">
              {avatarPreview || editedProfile.avatar ? (
                <img
                  src={avatarPreview || editedProfile.avatar}
                  alt="Profile"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/20 shadow-lg"
                />
              ) : (
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${getAvatarColor(editedProfile.name)} flex items-center justify-center text-white text-xl sm:text-2xl font-bold border-4 border-white/20 shadow-lg`}>
                  {editedProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 sm:p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
                  <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="text-white text-xs sm:text-sm font-medium">{uploadProgress}%</div>
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
              <h4 className="text-xl sm:text-2xl font-bold">{currentUser?.name}</h4>
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-400'} ring-2 ring-white flex-shrink-0`}></div>
            </div>
            <p className="text-white/80 mb-2 text-sm sm:text-base">{currentUser?.email}</p>
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-white/70">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Joined {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'Recently'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{connected ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Full Name
              </label>
              <input
                type="text"
                value={editedProfile.name}
                onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                Email Address
              </label>
              <input
                type="email"
                value={editedProfile.email}
                onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline w-4 h-4 mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                value={editedProfile.phone}
                onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Location
              </label>
              <input
                type="text"
                value={editedProfile.location}
                onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your location"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageCircle className="inline w-4 h-4 mr-1" />
                Status Message
              </label>
              <input
                type="text"
                value={editedProfile.statusMessage}
                onChange={(e) => setEditedProfile({ ...editedProfile, statusMessage: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What's on your mind?"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Bio
              </label>
              <textarea
                value={editedProfile.bio}
                onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Social Links</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="inline w-4 h-4 mr-1" />
                  Website
                </label>
                <input
                  type="url"
                  value={editedProfile.website}
                  onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://your-website.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Github className="inline w-4 h-4 mr-1" />
                  GitHub
                </label>
                <input
                  type="text"
                  value={editedProfile.github}
                  onChange={(e) => setEditedProfile({ ...editedProfile, github: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="github.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Twitter className="inline w-4 h-4 mr-1" />
                  Twitter
                </label>
                <input
                  type="text"
                  value={editedProfile.twitter}
                  onChange={(e) => setEditedProfile({ ...editedProfile, twitter: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="twitter.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Linkedin className="inline w-4 h-4 mr-1" />
                  LinkedIn
                </label>
                <input
                  type="text"
                  value={editedProfile.linkedin}
                  onChange={(e) => setEditedProfile({ ...editedProfile, linkedin: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="linkedin.com/in/username"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
            <button
              onClick={handleProfileUpdate}
              disabled={loading}
              className="flex items-center justify-center px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm sm:text-base"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={loading}
              className="flex items-center justify-center px-4 sm:px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Profile Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl sm:rounded-2xl border shadow-sm p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600">Member Since</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-800 truncate">
                {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'Recently'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl border shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600">Status</p>
                <p className="text-sm sm:text-lg font-semibold text-gray-800">
                  {connected ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'} flex-shrink-0`}></div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl border shadow-sm p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600">Custom Status</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-800 truncate">
                {currentUser?.status_message || 'No status'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Notification Preferences</h3>
        
        <div className="space-y-6">
          {/* Message Notifications */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-800">Message Notifications</h4>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm sm:text-base">New Messages</p>
                  <p className="text-xs sm:text-sm text-gray-600">Get notified when you receive new messages</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer self-end sm:self-auto">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.notifications.messages}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, messages: e.target.checked }
                  })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-800">Friend Requests</p>
                  <p className="text-sm text-gray-600">Get notified when someone sends you a friend request</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.notifications.friendRequests}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, friendRequests: e.target.checked }
                  })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-800">Sound Effects</p>
                  <p className="text-sm text-gray-600">Play sounds for notifications</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.notifications.sounds}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, sounds: e.target.checked }
                  })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-800">Email Notifications</h4>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-800">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.notifications.email}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notifications: { ...preferences.notifications, email: e.target.checked }
                  })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Privacy Settings</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Profile Visibility</p>
                <p className="text-sm text-gray-600">Who can see your profile</p>
              </div>
            </div>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={preferences.privacy.profileVisibility}
              onChange={(e) => setPreferences({
                ...preferences,
                privacy: { ...preferences.privacy, profileVisibility: e.target.value }
              })}
            >
              <option value="everyone">Everyone</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Activity className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Online Status</p>
                <p className="text-sm text-gray-600">Show when you're online</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={preferences.privacy.onlineStatus}
                onChange={(e) => setPreferences({
                  ...preferences,
                  privacy: { ...preferences.privacy, onlineStatus: e.target.checked }
                })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Last Seen</p>
                <p className="text-sm text-gray-600">Show when you were last active</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={preferences.privacy.lastSeen}
                onChange={(e) => setPreferences({
                  ...preferences,
                  privacy: { ...preferences.privacy, lastSeen: e.target.checked }
                })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Check className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Read Receipts</p>
                <p className="text-sm text-gray-600">Show when you've read messages</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={preferences.privacy.readReceipts}
                onChange={(e) => setPreferences({
                  ...preferences,
                  privacy: { ...preferences.privacy, readReceipts: e.target.checked }
                })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
        <h3 className="text-xl font-semibold text-red-600 mb-6">Danger Zone</h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-800">Change Password</p>
                <p className="text-sm text-red-600">Update your account password</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>

          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-800">Delete Account</p>
                <p className="text-sm text-red-600">Permanently delete your account and all data</p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Appearance Settings</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-gradient-to-r from-gray-900 to-gray-600 rounded"></div>
              <div>
                <p className="font-medium text-gray-800">Theme</p>
                <p className="text-sm text-gray-600">Choose your preferred theme</p>
              </div>
            </div>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={preferences.appearance.theme}
              onChange={(e) => setPreferences({
                ...preferences,
                appearance: { ...preferences.appearance, theme: e.target.value }
              })}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">A</div>
              <div>
                <p className="font-medium text-gray-800">Font Size</p>
                <p className="text-sm text-gray-600">Adjust text size for better readability</p>
              </div>
            </div>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={preferences.appearance.fontSize}
              onChange={(e) => setPreferences({
                ...preferences,
                appearance: { ...preferences.appearance, fontSize: e.target.value }
              })}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">Language</p>
                <p className="text-sm text-gray-600">Choose your preferred language</p>
              </div>
            </div>
            <select 
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={preferences.appearance.language}
              onChange={(e) => setPreferences({
                ...preferences,
                appearance: { ...preferences.appearance, language: e.target.value }
              })}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={onBackClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800">Profile Settings</h1>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center px-3 py-2 sm:px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Logout</span>
          <span className="sm:hidden">Exit</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {(success || error) && (
        <div className="mx-4 sm:mx-6 mt-4">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 flex items-center">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 sm:mr-3 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-green-700">{success}</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-center">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 sm:mr-3 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Mobile Tab Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-shrink-0 flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-shrink-0 flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-shrink-0 flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'privacy'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-4 h-4 mr-2" />
            Privacy
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-shrink-0 flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'appearance'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <SettingsIcon className="w-4 h-4 mr-2" />
            Appearance
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden md:block w-64 bg-white border-r border-gray-200 p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <User className="w-5 h-5 mr-3" />
              Profile
            </button>
            
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === 'notifications' 
                  ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Bell className="w-5 h-5 mr-3" />
              Notifications
            </button>
            
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === 'privacy' 
                  ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Shield className="w-5 h-5 mr-3" />
              Privacy & Security
            </button>
            
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === 'appearance' 
                  ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SettingsIcon className="w-5 h-5 mr-3" />
              Appearance
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'profile' && renderGeneralTab()}
          {activeTab === 'notifications' && renderNotificationTab()}
          {activeTab === 'privacy' && renderPrivacyTab()}
          {activeTab === 'appearance' && renderAppearanceTab()}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
