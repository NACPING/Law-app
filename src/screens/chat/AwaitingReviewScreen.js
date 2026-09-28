import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AwaitingReviewScreen({ navigation, route }) {
  const { consultId } = route.params || {};
  const [isReady, setIsReady] = useState(false);

  const openChat = async () => {
    try {
      if (!consultId) {
        Alert.alert('เปิดแชตไม่สำเร็จ', 'ไม่พบหมายเลขคำขอปรึกษา');
        return;
      }

      const storedUser = await AsyncStorage.getItem('userData');
      const currentUserId = storedUser ? JSON.parse(storedUser)?.id : null;
      if (currentUserId == null) {
        Alert.alert('เปิดแชตไม่สำเร็จ', 'ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่');
        return;
      }

      navigation.navigate('ChatRoom', {
        consultationId: consultId,
        currentUserId,
      });
    } catch (error) {
      console.error('Open consultation chat error:', error);
      Alert.alert('เปิดแชตไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Simulate server review process for 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consult with Us</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="bell" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {!isReady ? (
          <>
            <ActivityIndicator size="large" color="#333" style={styles.spinner} />
            <Text style={styles.statusText}>Awaiting Review</Text>
          </>
        ) : (
          <>
            <View style={styles.successCircle}>
              <Feather name="check" size={60} color="green" />
            </View>
            <TouchableOpacity 
              style={styles.readyButton} 
              onPress={openChat}
            >
              <FontAwesome5 name="comment-dots" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.readyButtonText}>Ready to Chat</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  iconButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    transform: [{ scale: 1.5 }],
    marginBottom: 30,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'green',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  readyButton: {
    flexDirection: 'row',
    backgroundColor: '#1E2B58',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  readyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
