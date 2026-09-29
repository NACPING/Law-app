import React, { useContext, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(useCallback(() => {
    let isActive = true;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const [storedUser, savedAvatar] = await Promise.all([
          AsyncStorage.getItem('userData'),
          AsyncStorage.getItem('userAvatar'),
        ]);

        try {
          const notificationsResponse = await apiClient.get('/notifications');
          const notificationList = Array.isArray(notificationsResponse.data)
            ? notificationsResponse.data
            : [];
          if (isActive) {
            setUnreadCount(notificationList.filter((notification) => !notification.isRead).length);
          }
        } catch (error) {
          console.error('Load unread notification count error:', error.response?.data || error.message);
        }

        let loadedUser = storedUser ? JSON.parse(storedUser) : null;
        try {
          const profileResponse = await apiClient.get('/users/me');
          loadedUser = profileResponse.data;
          await AsyncStorage.setItem('userData', JSON.stringify(loadedUser));
        } catch (error) {
          console.error('Load profile dashboard API error:', error.response?.data || error.message);
        }

        if (!isActive) return;
        setUserData(loadedUser);

        if (loadedUser?.avatarUrl) {
          setProfileImage(getFullImageUrl(loadedUser.avatarUrl));
        } else if (savedAvatar) {
          setProfileImage(savedAvatar);
        }
      } catch (error) {
        console.error('Load profile dashboard error:', error.response?.data || error.message);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      isActive = false;
    };
  }, []));

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
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>โปรไฟล์</Text>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('NotificationList')}
            accessibilityRole="button"
            accessibilityLabel={`การแจ้งเตือนที่ยังไม่ได้อ่าน ${unreadCount} รายการ`}
          >
            <Feather name="bell" size={23} color="#1E2B58" />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

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

        <DashboardSection
          title="กระทู้ของฉัน"
          items={userData?.posts}
          emptyMessage="ยังไม่มีข้อมูล"
          renderItem={(post) => (
            <DashboardRow
              key={post.id}
              title={post.title || 'กระทู้ไม่มีชื่อ'}
              detail={post.content}
              onPress={() => navigation.navigate('CommunityTab', {
                screen: 'PostDetail',
                params: { postId: post.id },
              })}
            />
          )}
        />

        <DashboardSection
          title="ประวัติปรึกษา"
          items={userData?.lawyerRequests}
          emptyMessage="ยังไม่มีข้อมูล"
          renderItem={(request) => (
            <DashboardRow
              key={request.id}
              title={request.subject || 'คำขอปรึกษาทนาย'}
              detail={request.status}
              onPress={() => {
                if (request.status === 'APPROVED') {
                  const consultationId = request.consultation?.id || request.consultationId;
                  if (consultationId) {
                    navigation.navigate('ConsultTab', {
                      screen: 'ChatRoom',
                      params: { consultationId },
                    });
                    return;
                  }
                }

                navigation.navigate('ConsultTab', { screen: 'ConsultationList' });
              }}
            />
          )}
        />

        <DashboardSection
          title="E-Book ที่บันทึกไว้"
          items={userData?.favorites}
          emptyMessage="ยังไม่มีข้อมูล"
          renderItem={(favorite) => (
            <DashboardRow
              key={favorite.id}
              title={favorite.ebook?.title || 'ไม่พบข้อมูล E-Book'}
              detail={favorite.ebook?.author}
              onPress={() => {
                if (!favorite.ebook?.id) {
                  Alert.alert('เปิด E-Book ไม่สำเร็จ', 'ไม่พบรหัสหนังสือ');
                  return;
                }

                navigation.navigate('EbookTab', {
                  screen: 'EbookDetail',
                  params: { ebookId: favorite.ebook.id },
                });
              }}
            />
          )}
        />

        {/* รายการเมนูตั้งค่า */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile', { userData })}
            accessibilityRole="button"
          >
            <View style={styles.menuIconBox}>
              <FontAwesome5 name="user-edit" size={16} color="#1E2B58" />
            </View>
            <Text style={styles.menuText}>แก้ไขข้อมูลส่วนตัว</Text>
            <Feather name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('ConsultTab', { screen: 'ConsultationList' })}
            accessibilityRole="button"
          >
            <View style={styles.menuIconBox}>
              <FontAwesome5 name="history" size={16} color="#1E2B58" />
            </View>
            <Text style={styles.menuText}>ประวัติการปรึกษากฎหมาย</Text>
            <Feather name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Privacy')}
            accessibilityRole="button"
          >
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

function DashboardSection({ title, items, emptyMessage, renderItem }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <View style={styles.dashboardSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.dashboardCard}>
        {list.length ? list.map(renderItem) : (
          <Text style={styles.emptyDashboardText}>{emptyMessage}</Text>
        )}
      </View>
    </View>
  );
}

function DashboardRow({ title, detail, onPress }) {
  return (
    <TouchableOpacity
      style={styles.dashboardRow}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <Text style={styles.dashboardItemTitle} numberOfLines={1}>{title}</Text>
      {!!detail && <Text style={styles.dashboardItemDetail} numberOfLines={2}>{detail}</Text>}
    </TouchableOpacity>
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
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pageTitle: {
    color: '#1E2B58',
    fontSize: 22,
    fontWeight: '700',
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  unreadBadge: {
    position: 'absolute',
    top: -3,
    right: -4,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
  dashboardSection: {
    marginBottom: 16,
  },
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  dashboardRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dashboardItemTitle: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  dashboardItemDetail: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  emptyDashboardText: {
    paddingVertical: 14,
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
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