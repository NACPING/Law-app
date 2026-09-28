import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import apiClient from './apiClient';

const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.38:5000/api')
  .replace(/\/api\/?$/, '');

let socket = null;

export const chatService = {
  requestConsult: (data) => apiClient.post('/chat/consult', data),
  // เริ่มเชื่อมต่อ Socket
  connectSocket: () => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: false,
        auth: (callback) => {
          AsyncStorage.getItem('userToken')
            .then((token) => callback({ token }))
            .catch((error) => {
              console.error('Load token for chat socket failed:', error);
              callback({ token: null });
            });
        },
      });
      socket.connect();
    }
    return socket;
  },

  // ดึงอินสแตนซ์ Socket ปัจจุบัน
  getSocket: () => socket,

  // เข้าร่วมห้อง
  joinRoom: (roomId) => {
    if (socket) {
      socket.emit('join_room', roomId);
    }
  },

  // ส่งข้อความ Real-time
  sendMessage: (messageData) => {
    if (socket) {
      socket.emit('send_message', messageData);
    }
  },

  // ดึงประวัติข้อความผ่าน HTTP API
  getHistory: (requestId) => apiClient.get(`/chat/${requestId}/messages`),

  // บันทึกข้อความลง Database
  sendMessageAPI: (requestId, text) => apiClient.post(`/chat/${requestId}/messages`, { text }),

  // ตัดการเชื่อมต่อ
  disconnectSocket: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
};