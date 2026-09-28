import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // เช็ก Token ตอนเปิดแอป
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) setUserToken(token);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  // ฟังก์ชัน Login
  const login = async (token, userData) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      if (userData) {
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      }
      setUserToken(token); // สั่งสลับหน้าทันที
    } catch (e) {
      console.error(e);
    }
  };

  // ออกจากระบบในเครื่องทันที โดยไม่ขึ้นกับผลของ API
  const logout = async () => {
    setUserToken(null);

    const keys = ['token', 'userToken', 'userData', 'userAvatar'];
    const results = await Promise.allSettled(
      keys.map((key) => AsyncStorage.removeItem(key))
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to remove ${keys[index]} during logout:`, result.reason);
      }
    });
  };

  return (
    <AuthContext.Provider value={{ userToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};