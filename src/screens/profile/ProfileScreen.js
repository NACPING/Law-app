import React, { useContext, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../services/apiClient';
import { AuthContext } from '../../AuthContext';

// 📍 ฟังก์ชันสำหรับแปลง Path รูปภาพจาก Backend ให้เป็น URL เต็ม
const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('file:')) return path;
  
  const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace('/api', '');
  return `${baseUrl}${path}`;
};

export default function ProfileScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  // โหลดข้อมูลผู้ใช้และรูปโปรไฟล์
  const loadUserProfile = async () => {
    try {
      const [storedUser, savedAvatar, profileResponse] = await Promise.all([
        AsyncStorage.getItem('userData'),
        AsyncStorage.getItem('userAvatar'),
        apiClient.get('/auth/me').catch(() => null), // ป้องกัน crash หาก API ล้มเหลว
      ]);

      const loadedUser = profileResponse?.data || (storedUser ? JSON.parse(storedUser) : null);
      
      if (loadedUser) {
        setUserData(loadedUser);
        await AsyncStorage.setItem('userData', JSON.stringify(loadedUser));
        
        // ถ้า Backend มี avatarUrl ให้ใช้รูปจาก Backend ก่อน
        if (loadedUser.avatarUrl) {
          setProfileImage(getFullImageUrl(loadedUser.avatarUrl));
        } else if (savedAvatar) {
          setProfileImage(savedAvatar);
        }
      }
    } catch (error) {
      console.error('Load user profile error:', error.message);
      const storedUser = await AsyncStorage.getItem('userData');
      if (storedUser) {
        setUserData(JSON.parse(storedUser));
      }
    } finally {
      setLoading(false);
    }
  };

  // 🚀 ฟังก์ชันยิง API อัปโหลดรูปไปยัง Backend
  const uploadAvatarToBackend = async (imageUri) => {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type,
      });

      const response = await apiClient.post('/auth/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.avatarUrl) {
        const fullUrl = getFullImageUrl(response.data.avatarUrl);
        setProfileImage(fullUrl);
        await AsyncStorage.setItem('userAvatar', fullUrl);
        Alert.alert('สำเร็จ', 'อัปเดตรูปโปรไฟล์ลงระบบเรียบร้อยแล้ว');
      }
    } catch (error) {
      console.error('Upload avatar frontend error:', error.response?.data || error.message);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถส่งรูปภาพไปยังเซิร์ฟเวอร์ได้');
    }
  };

  // 📸 ฟังก์ชันเลือกรูปโปรไฟล์
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'ต้องการการอนุญาต',
          'กรุณาเปิดการอนุญาตให้แอปเข้าถึงคลังภาพในการตั้งค่าโทรศัพท์เพื่อเปลี่ยนรูปโปรไฟล์'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setProfileImage(selectedUri); // แสดงรูปชั่วคราวบนหน้าจอทันที
        await uploadAvatarToBackend(selectedUri); // ส่งไฟล์ไป Backend
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปิดคลังภาพได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // ออกจากระบบ
  const handleLogout = async () => {
    Alert.alert('ยืนยันออกจากระบบ', 'คุณต้องการออกจากระบบใช่หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ออกจากระบบ',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E2B58" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header ส่วนรูปโปรไฟล์ */}
        <View style={styles.profileHeader}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage} activeOpacity={0.8}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.defaultAvatar}>
                <FontAwesome5 name="user" size={42} color="#1E2B58" />
              </View>
            )}

            <View style={styles.cameraBadge}>
              <Feather name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>
            {userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : 'ผู้ใช้งาน'}
          </Text>
          <Text style={styles.userEmail}>{userData?.email || 'user@example.com'}</Text>
          <Text style={styles.changePhotoText}>แตะที่รูปเพื่อเปลี่ยนรูปโปรไฟล์</Text>
        </View>

        {/* ข้อมูลส่วนตัว */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>ข้อมูลส่วนตัว</Text>
          <View style={styles.infoCard}>
            <InfoRow label="ชื่อ-นามสกุล" value={`${userData?.firstName || '-'} ${userData?.lastName || ''}`.trim()} />
            <InfoRow label="อีเมล" value={userData?.email} />
            <InfoRow label="เบอร์โทรศัพท์" value={userData?.phone} />
            <InfoRow label="เลขบัตรประชาชน / พาสปอร์ต" value={userData?.idCard} />
            <InfoRow label="วันเกิด" value={userData?.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString('th-TH') : '-'} />
          </View>
        </View>

        {/* รายการเมนูตั้งค่า */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconBox}>
              <FontAwesome5 name="user-edit" size={16} color="#1E2B58" />
            </View>
            <Text style={styles.menuText}>แก้ไขข้อมูลส่วนตัว</Text>
            <Feather name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconBox}>
              <FontAwesome5 name="history" size={16} color="#1E2B58" />
            </View>
            <Text style={styles.menuText}>ประวัติการปรึกษากฎหมาย</Text>
            <Feather name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconBox}>
              <Feather name="shield" size={18} color="#1E2B58" />
            </View>
            <Text style={styles.menuText}>ความเป็นส่วนตัวและความปลอดภัย</Text>
            <Feather name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* ปุ่มออกจากระบบ */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Component สำหรับแสดงแต่ละบรรทัดข้อมูล
function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  avatarWrapper: {
    position: 'relative',
    width: 96,
    height: 96,
    marginBottom: 12,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  defaultAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1E2B58',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  changePhotoText: {
    fontSize: 12,
    color: '#1E2B58',
    fontWeight: '500',
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E2B58',
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    elevation: 2,
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#EF4444',
  },
});