import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { consultationService } from '../../services/consultationService';

const getStatusLabel = (status) => {
  if (status === 'APPROVED') return 'อนุมัติแล้ว';
  if (status === 'AWAITING_REVIEW') return 'รอการตรวจสอบ';
  return status || 'ไม่ทราบสถานะ';
};

export default function ConsultationListScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [approvingRequestId, setApprovingRequestId] = useState(null);

  const loadRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    try {
      const userRequests = await consultationService.getMyRequests();
      setRequests(userRequests);
      setLoadError(false);
    } catch (error) {
      console.error('Load consultation requests error:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadInitialData = async () => {
      try {
        const [userRequests, storedUser] = await Promise.all([
          consultationService.getMyRequests(),
          AsyncStorage.getItem('userData'),
        ]);
        if (!isActive) return;
        setRequests(userRequests);
        setUserRole(storedUser ? JSON.parse(storedUser)?.role : null);
        setLoadError(false);
      } catch (error) {
        console.error('Load consultation requests error:', error);
        if (isActive) setLoadError(true);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      isActive = false;
    };
  }, []);

  const handleApprove = async (item) => {
    console.log('[ConsultationListScreen] Starting approval:', item.id);
    setApprovingRequestId(item.id);
    try {
      const res = await consultationService.approveRequest(item.id);
      console.log('[ConsultationListScreen] Approval API succeeded:', item.id);
      const consultationId = res.data?.consultation?.id;

      if (!consultationId) {
        console.error('[ConsultationListScreen] Approval response missing consultation ID:', item.id);
        throw new Error('Approve response did not include a consultation ID');
      }

      console.log('[ConsultationListScreen] Navigating to ChatRoom:', consultationId);
      navigation.navigate('ChatRoom', { consultationId });
    } catch (error) {
      console.error('[ConsultationListScreen] Approve request failed:', error.response?.data || error);
      Alert.alert(
        'รับคำปรึกษาไม่สำเร็จ',
        error.response?.data?.message || 'ไม่สามารถอนุมัติคำขอได้ กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setApprovingRequestId(null);
    }
  };

  const confirmApproval = (item) => {
    console.log('[ConsultationListScreen] Lawyer selected request:', item.id);
    if (Platform.OS === 'web') {
      const confirm = window.confirm('รับเคสนี้ไหม?');
      console.log('[ConsultationListScreen] Web confirmation result:', confirm);
      if (confirm) handleApprove(item);
      return;
    }

    Alert.alert(
      'ยืนยันรับคำปรึกษา',
      'ต้องการรับให้คำปรึกษาเคสนี้หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ตกลง',
          onPress: () => handleApprove(item),
        },
      ]
    );
  };

  const openRequest = (item) => {
    console.log('[ConsultationListScreen] Request selected:', item.id, item.status);
    if (item.status === 'APPROVED') {
      if (!item.consultationId) {
        Alert.alert('เปิดแชทไม่สำเร็จ', 'ไม่พบข้อมูลห้องแชท');
        return;
      }

      navigation.navigate('ChatRoom', { consultationId: item.consultationId });
      return;
    }

    if (userRole === 'LAWYER' && item.status === 'AWAITING_REVIEW') {
      confirmApproval(item);
    }
  };

  const renderRequest = ({ item }) => {
    const isApproved = item.status === 'APPROVED';
    const canApprove = userRole === 'LAWYER' && item.status === 'AWAITING_REVIEW';
    const isApproving = approvingRequestId === item.id;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled: !isApproved && !canApprove }}
        activeOpacity={isApproved || canApprove ? 0.75 : 1}
        style={styles.requestCard}
        onPress={() => openRequest(item)}
        disabled={isApproving}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.subject} numberOfLines={2}>
            {item.subject || 'คำขอปรึกษาทนาย'}
          </Text>
          <View style={[styles.statusBadge, isApproved ? styles.approvedBadge : styles.pendingBadge]}>
            <Text style={[styles.statusText, isApproved && styles.approvedText]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        {!!item.message && (
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.date}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('th-TH') : ''}
          </Text>
          {isApproved && (
            <View style={styles.openChat}>
              <Text style={styles.openChatText}>เปิดแชต</Text>
              <Feather name="chevron-right" size={16} color="#1E3A8A" />
            </View>
          )}
          {canApprove && (
            <View style={styles.openChat}>
              {isApproving && <ActivityIndicator size="small" color="#1E3A8A" />}
              <Text style={styles.openChatText}>
                {isApproving ? 'กำลังรับเคส...' : 'รับให้คำปรึกษา'}
              </Text>
              {!isApproving && <Feather name="chevron-right" size={16} color="#1E3A8A" />}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>โหลดรายการคำขอไม่สำเร็จ</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              loadRequests();
            }}
          >
            <Text style={styles.retryText}>ลองอีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderRequest}
          contentContainerStyle={requests.length ? styles.listContent : styles.emptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadRequests(true)}
              colors={['#1E3A8A']}
            />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>ยังไม่มีคำขอปรึกษา</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5F9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  listContent: { padding: 16 },
  emptyList: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6B7280', fontSize: 15, textAlign: 'center' },
  requestCard: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  subject: { flex: 1, marginRight: 10, color: '#1F2937', fontSize: 16, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  approvedBadge: { backgroundColor: '#DCFCE7' },
  pendingBadge: { backgroundColor: '#FEF3C7' },
  statusText: { color: '#92400E', fontSize: 11, fontWeight: '600' },
  approvedText: { color: '#166534' },
  message: { marginTop: 10, color: '#4B5563', fontSize: 14, lineHeight: 20 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  date: { color: '#9CA3AF', fontSize: 12 },
  openChat: { flexDirection: 'row', alignItems: 'center' },
  openChatText: { color: '#1E3A8A', fontSize: 13, fontWeight: '600' },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#1E3A8A',
  },
  retryText: { color: '#FFF', fontWeight: '600' },
});