import React, { useState, useEffect } from 'react';
import './App.css';
import ChatApp from './components/ChatApp';
import Login from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import notificationService from './services/notificationService';

function AppContent() {
  const { user, loading } = useAuth();
  const [notificationPermission, setNotificationPermission] = useState(null);

  useEffect(() => {
    // Initialize notification service when user is logged in
    if (user) {
      const initNotifications = async () => {
        const hasPermission = await notificationService.requestPermission();
        setNotificationPermission(hasPermission);
        
        if (hasPermission) {
          console.log('Notification permission granted');
        } else {
          console.log('Notification permission denied');
        }
      };
      
      initNotifications();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {user ? (
        <SocketProvider>
          <ChatApp />
        </SocketProvider>
      ) : (
        <Login />
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
