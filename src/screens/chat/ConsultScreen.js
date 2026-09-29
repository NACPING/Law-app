import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { chatService } from '../../services/chatService';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConsultScreen({ navigation }) {
  const [subject, setSubject] = useState('');
  const [events, setEvents] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกหัวข้อและข้อความ');
      return;
    }
    setSending(true);
    try {
      const response = await chatService.requestConsult({
        subject: subject.trim(),
        events: events.trim(),
        message: message.trim(),
      });
      navigation.navigate('AwaitingReview', { consultId: response.data.id });
    } catch (error) {
      console.error('Create consult error:', error.response?.data || error.message);
      Alert.alert('ส่งคำขอไม่สำเร็จ', error.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('ConsultationList')}
            accessibilityRole="button"
            accessibilityLabel="ดูคำขอปรึกษาของฉัน"
          >
            <Feather name="menu" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Consult with Us</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('ConsultationList')}
            accessibilityRole="button"
            accessibilityLabel="ดูคำขอปรึกษาของฉัน"
          >
            <Feather name="bell" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formCard}>
            
            {/* Logo overlaps the top of the card */}
            <View style={styles.logoContainer}>
              <FontAwesome5 name="dove" size={50} color="#000" />
            </View>

            <Text style={styles.formTitle}>Fill Information</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Subject of inquiry"
                placeholderTextColor="#a0a0a0"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Sequence of events"
                placeholderTextColor="#a0a0a0"
                multiline
                numberOfLines={4}
                value={events}
                onChangeText={setEvents}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Message to us"
                placeholderTextColor="#a0a0a0"
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  iconButton: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60, // Space for the overlapping logo
  },
  formCard: {
    backgroundColor: '#1E2B58', // Dark blue theme
    borderRadius: 20,
    padding: 20,
    paddingTop: 60, // Space inside card for logo
    alignItems: 'center',
    position: 'relative',
    marginTop: 20,
  },
  logoContainer: {
    position: 'absolute',
    top: -50, // Overlap effect
    alignSelf: 'center',
    backgroundColor: '#fff',
    width: 120,
    height: 90,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  formTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    height: 100,
  },
  sendButton: {
    marginTop: 10,
    width: 150,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
