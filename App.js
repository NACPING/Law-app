import React, { useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { AuthContext, AuthProvider } from './src/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { chatService } from './src/services/chatService';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { userToken } = useContext(AuthContext);

  useEffect(() => {
    if (!userToken) return undefined;

    const socket = chatService.connectSocket();
    const joinUserRoom = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userData');
        const userId = storedUser ? JSON.parse(storedUser)?.id : null;
        if (typeof userId === 'string') {
          socket.emit('joinUserRoom', userId);
        } else {
          console.error('Cannot join notification room: user ID is missing');
        }
      } catch (error) {
        console.error('Join notification room failed:', error);
      }
    };
    const handleNotification = (data) => {
      Toast.show({
        type: 'success',
        text1: data.title,
        text2: data.message,
        position: 'top',
      });
    };

    socket.on('connect', joinUserRoom);
    socket.on('notification', handleNotification);
    if (socket.connected) joinUserRoom();

    return () => {
      socket.off('connect', joinUserRoom);
      socket.off('notification', handleNotification);
      chatService.disconnectSocket();
    };
  }, [userToken]);

  return (
    <>
      <RootNavigator />
      <Toast />
    </>
  );
}