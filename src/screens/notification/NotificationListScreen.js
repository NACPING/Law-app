import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../services/apiClient';

const formatNotificationDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export default function NotificationListScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [updatingIds, setUpdatingIds] = useState([]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await apiClient.get('/notifications');
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Load notifications error:', error.response?.data || error.message);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleNotificationPress = async (notification) => {
    if (notification.isRead || updatingIds.includes(notification.id)) return;

    setUpdatingIds((currentIds) => [...currentIds, notification.id]);
    try {
      await apiClient.patch(`/notifications/${notification.id}/read`);
      setNotifications((currentNotifications) => currentNotifications.map((item) => (
        item.id === notification.id ? { ...item, isRead: true } : item
      )));
    } catch (error) {
      console.error('Mark notification as read error:', error.response?.data || error.message);
      Alert.alert(
        'อัปเดตไม่สำเร็จ',
        error.response?.data?.message || 'ไม่สามารถทำเครื่องหมายว่าอ่านแล้วได้ กรุณาลองใหม่'
      );
    } finally {
      setUpdatingIds((currentIds) => currentIds.filter((id) => id !== notification.id));
    }
  };

  const renderNotification = ({ item }) => {
    const isUpdating = updatingIds.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.notification, !item.isRead && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
        disabled={isUpdating}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.isRead ? 'อ่านแล้ว' : 'ยังไม่ได้อ่าน'}`}
      >
        <View style={styles.statusColumn}>
          {isUpdating ? (
            <ActivityIndicator size="small" color="#1E3A8A" />
          ) : (
            <View style={[styles.statusDot, item.isRead && styles.readDot]}>
              {item.isRead && <Feather name="check" size={10} color="#FFFFFF" />}
            </View>
          )}
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.date}>{formatNotificationDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={styles.loading} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={notifications.length ? styles.list : styles.emptyContainer}
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              <Feather name="bell" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>
                {loadError ? 'โหลดการแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่' : 'ยังไม่มีการแจ้งเตือน'}
              </Text>
              {loadError && (
                <TouchableOpacity onPress={loadNotifications} accessibilityRole="button">
                  <Text style={styles.retryText}>ลองอีกครั้ง</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loading: {
    marginTop: 32,
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  notification: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    padding: 16,
    elevation: 1,
  },
  unreadNotification: {
    backgroundColor: '#EFF6FF',
  },
  statusColumn: {
    width: 28,
    paddingTop: 4,
    alignItems: 'center',
  },
  statusDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readDot: {
    backgroundColor: '#9CA3AF',
  },
  notificationContent: {
    flex: 1,
  },
  title: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '500',
  },
  unreadTitle: {
    color: '#1E2B58',
    fontWeight: '700',
  },
  message: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
  },
  date: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  retryText: {
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
});
