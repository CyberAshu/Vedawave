class NotificationService {
  constructor() {
    this.permission = 'default';
    this.settings = {
      messages: true,
      friendRequests: true,
      sounds: true,
      email: false
    };
    this.init();
  }

  // Initialize notification service
  async init() {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    // Get current permission status
    this.permission = Notification.permission;

    // Load settings from localStorage
    this.loadSettings();

    return true;
  }

  // Request notification permission
  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Check if notifications are supported and permitted
  isAvailable() {
    return 'Notification' in window && this.permission === 'granted';
  }

  // Load notification settings from localStorage
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('notification_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  // Save notification settings to localStorage
  saveSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      localStorage.setItem('notification_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  // Update specific setting
  updateSetting(key, value) {
    this.settings[key] = value;
    this.saveSettings(this.settings);
  }

  // Get current settings
  getSettings() {
    return { ...this.settings };
  }

  // Play notification sound
  playNotificationSound() {
    if (!this.settings.sounds) return;

    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a simple notification sound using oscillator
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  // Show browser notification
  showNotification(title, options = {}) {
    if (!this.isAvailable()) {
      console.warn('Notifications not available');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag || 'vedawave-notification',
        requireInteraction: false,
        silent: !this.settings.sounds,
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Play sound if enabled
      if (this.settings.sounds) {
        this.playNotificationSound();
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  // Show new message notification
  showMessageNotification(sender, message, chatId) {
    if (!this.settings.messages) return null;

    const options = {
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      tag: `message-${chatId}`,
      data: {
        type: 'message',
        chatId: chatId,
        senderId: sender.id
      }
    };

    const notification = this.showNotification(`New message from ${sender.name}`, options);

    // Handle notification click
    if (notification) {
      notification.onclick = () => {
        window.focus();
        // Dispatch custom event to handle navigation
        window.dispatchEvent(new CustomEvent('notificationClick', {
          detail: { type: 'message', chatId: chatId }
        }));
        notification.close();
      };
    }

    return notification;
  }

  // Show friend request notification
  showFriendRequestNotification(sender) {
    if (!this.settings.friendRequests) return null;

    const options = {
      body: `${sender.name} wants to be your friend`,
      tag: `friend-request-${sender.id}`,
      data: {
        type: 'friend_request',
        senderId: sender.id
      }
    };

    const notification = this.showNotification('New Friend Request', options);

    // Handle notification click
    if (notification) {
      notification.onclick = () => {
        window.focus();
        // Dispatch custom event to handle navigation
        window.dispatchEvent(new CustomEvent('notificationClick', {
          detail: { type: 'friend_request', senderId: sender.id }
        }));
        notification.close();
      };
    }

    return notification;
  }

  // Show typing notification (in-app only)
  showTypingNotification(sender, chatId) {
    // This would be handled by the chat interface directly
    // Just dispatch an event for the UI to handle
    window.dispatchEvent(new CustomEvent('typingNotification', {
      detail: { sender, chatId, isTyping: true }
    }));
  }

  // Hide typing notification
  hideTypingNotification(senderId, chatId) {
    window.dispatchEvent(new CustomEvent('typingNotification', {
      detail: { senderId, chatId, isTyping: false }
    }));
  }

  // Show online status notification
  showOnlineStatusNotification(user, isOnline) {
    // Only show if user comes online (not when going offline)
    if (!isOnline) return;

    const options = {
      body: `${user.name} is now online`,
      tag: `online-status-${user.id}`,
      data: {
        type: 'online_status',
        userId: user.id
      }
    };

    // Only show for 2 seconds for status updates
    const notification = this.showNotification('Friend Online', options);
    if (notification) {
      setTimeout(() => {
        notification.close();
      }, 2000);
    }

    return notification;
  }

  // Clear all notifications with specific tag
  clearNotifications(tag) {
    // Note: There's no direct way to clear existing notifications
    // This is a limitation of the Notification API
    console.log(`Clearing notifications with tag: ${tag}`);
  }

  // Check if the page is visible
  isPageVisible() {
    return !document.hidden && document.visibilityState === 'visible';
  }

  // Check if user is focused on current chat
  isUserFocusedOnChat(chatId) {
    // This would need to be set by the chat component
    return window.currentActiveChatId === chatId && this.isPageVisible();
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
