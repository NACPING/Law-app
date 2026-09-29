import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { chatService } from '../../services/chatService';
import { consultationService } from '../../services/consultationService';
import apiClient from '../../services/apiClient';

const getChatImageUrl = (fileUrl) => {
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  const baseUrl = apiClient.defaults.baseURL.replace(/\/api\/?$/, '');
  return `${baseUrl}${fileUrl}`;
};

const isImageMessage = (message) => {
  const content = message.message ?? message.text ?? message.content ?? '';
  return message.type === 'IMAGE'
    || (typeof content === 'string' && /^https?:\/\/\S+\.(avif|gif|heic|heif|jpe?g|png|webp)(?:\?\S*)?$/i.test(content))
    || (typeof content === 'string' && content.startsWith('/uploads/'));
};

const getMessageContent = (message) => message.message ?? message.text ?? message.content ?? '';

const mergeMessages = (current, incoming) => {
  const messagesById = new Map(current.map((message, index) => [
    message.id ?? `current-${index}`,
    message,
  ]));

  incoming.forEach((message, index) => {
    messagesById.set(message.id ?? `incoming-${index}`, message);
  });

  return [...messagesById.values()].sort(
    (first, second) => new Date(first.createdAt || 0) - new Date(second.createdAt || 0)
  );
};

export default function ChatRoomScreen({ navigation, route }) {
  const { consultationId, currentUserId: routeUserId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentUserId, setCurrentUserId] = useState(routeUserId ?? null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [completed, setCompleted] = useState(false);
  const flatListRef = useRef(null);

  const handleReceiveMessage = useCallback((message) => {
    setMessages((current) => mergeMessages(current, [message]));
    if (String(message.senderId) === String(currentUserId)) setSending(false);
  }, [currentUserId]);

  useEffect(() => {
    if (!consultationId) return undefined;

    let isActive = true;
    const socket = chatService.connectSocket();
    const joinRoom = () => {
      setSocketConnected(true);
      socket.emit('joinRoom', consultationId);
    };
    const handleDisconnect = () => setSocketConnected(false);
    const handleSocketError = ({ message }) => {
      console.error('Consultation chat socket error:', message);
      Alert.alert('ส่งข้อความไม่สำเร็จ', message || 'กรุณาลองใหม่อีกครั้ง');
      setSending(false);
    };

    socket.on('connect', joinRoom);
    socket.on('disconnect', handleDisconnect);
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('error_message', handleSocketError);
    if (socket.connected) joinRoom();

    const loadChat = async () => {
      try {
        try {
          const storedUser = await AsyncStorage.getItem('userData');
          const userData = storedUser ? JSON.parse(storedUser) : null;
          if (isActive) {
            if (routeUserId == null) setCurrentUserId(userData?.id ?? null);
            setUserRole(userData?.role ?? null);
          }
        } catch (error) {
          console.error('Load consultation user data error:', error);
        }

        const history = await consultationService.getChatHistory(consultationId);
        if (isActive) setMessages((current) => mergeMessages(current, history));
      } catch (error) {
        console.error('Load consultation chat history error:', error);
        if (isActive) {
          Alert.alert('โหลดประวัติแชตไม่สำเร็จ', 'คุณยังสามารถส่งข้อความได้');
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadChat();

    return () => {
      isActive = false;
      socket.off('connect', joinRoom);
      socket.off('disconnect', handleDisconnect);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('error_message', handleSocketError);
    };
  }, [consultationId, handleReceiveMessage, routeUserId]);

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text || sending || completed) return;
    if (!consultationId || currentUserId == null) {
      Alert.alert('ส่งข้อความไม่สำเร็จ', 'ไม่พบข้อมูลผู้ใช้งานหรือห้องสนทนา');
      return;
    }

    const socket = chatService.getSocket();
    if (!socket?.connected) {
      Alert.alert('ส่งข้อความไม่สำเร็จ', 'กำลังเชื่อมต่อห้องแชต กรุณาลองอีกครั้ง');
      return;
    }

    setSending(true);
    socket.emit('sendMessage', {
      consultationId,
      senderId: String(currentUserId),
      message: text,
    });
    setInputText('');
  };

  const pickAndSendImage = async () => {
    if (uploadingImage || sending || completed) return;
    if (!consultationId || currentUserId == null) {
      Alert.alert('ส่งรูปภาพไม่สำเร็จ', 'ไม่พบข้อมูลผู้ใช้งานหรือห้องสนทนา');
      return;
    }

    const socket = chatService.getSocket();
    if (!socket?.connected) {
      Alert.alert('ส่งรูปภาพไม่สำเร็จ', 'กำลังเชื่อมต่อห้องแชต กรุณาลองอีกครั้ง');
      return;
    }

    setUploadingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const name = asset.fileName || asset.uri.split('/').pop() || 'chat-image.jpg';
      const extension = name.split('.').pop()?.toLowerCase();
      const mimeType = asset.mimeType || (extension === 'png' ? 'image/png' : 'image/jpeg');
      const formData = new FormData();
      if (Platform.OS === 'web' && asset.file) {
        formData.append('file', asset.file, name);
      } else {
        formData.append('file', {
          uri: asset.uri,
          name,
          type: mimeType,
        });
      }

      const response = await apiClient.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const fileUrl = response.data?.fileUrl;
      if (typeof fileUrl !== 'string' || !fileUrl) {
        throw new Error('Upload response did not include a file URL');
      }

      if (!socket?.connected) {
        throw new Error('Chat socket is not connected');
      }
      socket.emit('sendMessage', {
        consultationId,
        senderId: String(currentUserId),
        message: fileUrl,
        type: 'IMAGE',
      });
    } catch (error) {
      console.error('Upload/send chat image error:', error.response?.data || error);
      Alert.alert('ส่งรูปภาพไม่สำเร็จ', error.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    if (messages.length) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const finishConsultation = useCallback(async (review) => {
    if (submittingReview || completed) return;

    setSubmittingReview(true);
    try {
      await consultationService.completeConsultation(consultationId, review);
      setCompleted(true);
      setReviewVisible(false);
      setInputText('');
      Toast.show({
        type: 'success',
        text1: review ? 'ขอบคุณสำหรับการรีวิว' : 'ปิดเคสเรียบร้อย',
        position: 'top',
      });
      navigation.navigate('ConsultationList');
    } catch (error) {
      console.error('Complete consultation error:', error.response?.data || error);
      Alert.alert(
        'จบการสนทนาไม่สำเร็จ',
        error.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setSubmittingReview(false);
    }
  }, [completed, consultationId, navigation, submittingReview]);

  const submitReview = useCallback(async () => {
    if (rating < 1 || submittingReview || completed) return;
    await finishConsultation({ rating, comment: comment.trim() });
  }, [comment, completed, finishConsultation, rating, submittingReview]);

  const handleEndConsultation = useCallback(() => {
    if (completed || submittingReview) return;
    if (userRole === 'LAWYER') {
      finishConsultation();
      return;
    }
    setReviewVisible(true);
  }, [completed, finishConsultation, submittingReview, userRole]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="ยุติการสนทนา"
          onPress={handleEndConsultation}
          disabled={completed || submittingReview}
          style={styles.headerAction}
        >
          <Text style={styles.headerActionText}>ยุติการสนทนา</Text>
        </TouchableOpacity>
      ),
    });
  }, [completed, handleEndConsultation, navigation, submittingReview]);

  if (!consultationId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.emptyText}>ไม่พบหมายเลขคำขอปรึกษา</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {!socketConnected && (
          <Text style={styles.connectionStatus}>กำลังเชื่อมต่อห้องแชต...</Text>
        )}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#1E3A8A" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={<Text style={styles.emptyText}>เริ่มต้นพูดคุยกับทนายความได้เลย</Text>}
            renderItem={({ item }) => {
              const isUserMessage = String(item.senderId) === String(currentUserId);
              return (
                <View
                  style={[
                    styles.messageBubble,
                    isUserMessage ? styles.userBubble : styles.lawyerBubble,
                  ]}
                >
                  {!isUserMessage && <Text style={styles.senderLabel}>ทนายความ</Text>}
                    {isImageMessage(item) ? (
                      <Image
                        source={{ uri: getChatImageUrl(getMessageContent(item)) }}
                        style={styles.chatImage}
                        resizeMode="cover"
                        accessibilityLabel="รูปภาพที่ส่งในแชต"
                      />
                    ) : (
                      <Text style={isUserMessage ? styles.userText : styles.lawyerText}>
                        {getMessageContent(item)}
                      </Text>
                    )}
                  {!!item.createdAt && (
                    <Text style={isUserMessage ? styles.userTime : styles.lawyerTime}>
                      {new Date(item.createdAt).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </View>
              );
            }}
          />
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="เลือกรูปภาพ"
            style={styles.imageButton}
            onPress={pickAndSendImage}
            disabled={uploadingImage || sending || completed}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color="#1E3A8A" />
            ) : (
              <Feather name="image" size={21} color="#1E3A8A" />
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="พิมพ์ข้อความปรึกษา..."
            placeholderTextColor="#8A8F98"
            multiline
            maxLength={2000}
            editable={!sending && !completed}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="ส่งข้อความ"
            style={[styles.sendButton, (sending || completed) && styles.disabledButton]}
            onPress={sendMessage}
            disabled={sending || completed}
          >
            <Feather name="send" size={18} color="#FFF" />
            <Text style={styles.sendButtonText}>ส่ง</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <Modal
        visible={reviewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!submittingReview) setReviewVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.reviewModal}>
            <Text style={styles.reviewTitle}>ให้คะแนนทนายความ</Text>
            <Text style={styles.reviewPrompt}>เลือกคะแนน 1–5 ดาว</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  accessibilityRole="button"
                  accessibilityLabel={`${star} ดาว`}
                  accessibilityState={{ selected: rating === star }}
                  onPress={() => setRating(star)}
                  disabled={submittingReview}
                  style={styles.starButton}
                >
                  <MaterialCommunityIcons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={34}
                    color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="พิมพ์คำติชมหรือข้อเสนอแนะ (ไม่บังคับ)"
              placeholderTextColor="#8A8F98"
              multiline
              maxLength={1000}
              editable={!submittingReview}
              textAlignVertical="top"
            />
            <View style={styles.reviewActions}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setReviewVisible(false)}
                disabled={submittingReview}
                style={styles.cancelReviewButton}
              >
                <Text style={styles.cancelReviewText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={submitReview}
                disabled={rating < 1 || submittingReview}
                style={[
                  styles.submitReviewButton,
                  (rating < 1 || submittingReview) && styles.disabledButton,
                ]}
              >
                {submittingReview ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitReviewText}>ส่งรีวิว</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5F9' },
  keyboardContainer: { flex: 1 },
  connectionStatus: {
    paddingVertical: 6,
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#FFF',
  },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageList: { flexGrow: 1, justifyContent: 'flex-end', padding: 16 },
  emptyText: { alignSelf: 'center', color: '#6B7280', paddingVertical: 20 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginVertical: 5 },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E3A8A',
    borderBottomRightRadius: 4,
  },
  lawyerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  senderLabel: { color: '#6B7280', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  userText: { color: '#FFF', fontSize: 15, lineHeight: 21 },
  lawyerText: { color: '#1F2937', fontSize: 15, lineHeight: 21 },
  userTime: { color: '#CBD5E1', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  lawyerTime: { color: '#9CA3AF', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  imageButton: {
    width: 40,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  chatImage: {
    width: 220,
    height: 180,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: '#1F2937',
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    fontSize: 15,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    marginLeft: 8,
    paddingHorizontal: 14,
    backgroundColor: '#1E3A8A',
    borderRadius: 22,
  },
  disabledButton: { opacity: 0.6 },
  sendButtonText: { color: '#FFF', fontWeight: '600' },
  headerAction: { paddingHorizontal: 8, paddingVertical: 6 },
  headerActionText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  reviewModal: {
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 18,
  },
  reviewTitle: { color: '#1F2937', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  reviewPrompt: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 8 },
  ratingRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 18 },
  starButton: { paddingHorizontal: 5, paddingVertical: 4 },
  commentInput: {
    minHeight: 110,
    maxHeight: 160,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    color: '#1F2937',
    fontSize: 15,
  },
  reviewActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18 },
  cancelReviewButton: { justifyContent: 'center', paddingHorizontal: 16, marginRight: 8 },
  cancelReviewText: { color: '#4B5563', fontSize: 15, fontWeight: '600' },
  submitReviewButton: {
    minWidth: 104,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
  },
  submitReviewText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
