import React, { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

const NotificationBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Check initial permission status
    const checkPermission = () => {
      if ('Notification' in window) {
        setPermission(Notification.permission);
        setShowBanner(Notification.permission === 'default');
      }
    };

    checkPermission();

    // Listen for permission changes
    const handlePermissionChange = () => {
      checkPermission();
    };

    // Some browsers support the permission change event
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'notifications' }).then(permissionStatus => {
        permissionStatus.onchange = handlePermissionChange;
      });
    }

    return () => {
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'notifications' }).then(permissionStatus => {
          permissionStatus.onchange = null;
        });
      }
    };
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setPermission('granted');
      setShowBanner(false);
      // Show a test notification
      notificationService.showNotification('VedaWave Notifications', {
        body: 'Notifications are now enabled! You\'ll receive alerts for new messages.',
        tag: 'welcome-notification'
      });
    } else {
      setPermission('denied');
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner || !('Notification' in window)) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white px-4 py-3 shadow-lg z-50">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="text-lg">🔔</div>
          <div>
            <p className="font-medium">Stay updated with notifications</p>
            <p className="text-sm text-blue-100">
              Enable notifications to receive alerts for new messages and friend requests
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEnableNotifications}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Enable
          </button>
          <button
            onClick={handleDismiss}
            className="text-blue-100 hover:text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;
