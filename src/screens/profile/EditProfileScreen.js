import { useState } from 'react';
import {
  ActivityIndicator,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../services/apiClient';

export default function EditProfileScreen({ route, navigation }) {
  const userData = route.params?.userData || {};
  const [firstName, setFirstName] = useState(userData.firstName || '');
  const [lastName, setLastName] = useState(userData.lastName || '');
  const [phone, setPhone] = useState(userData.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const profile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
    };

    if (!profile.firstName) {
      Alert.alert('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อ');
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.patch('/users/me', profile);
      const updatedUser = { ...userData, ...response.data };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      Alert.alert('บันทึกสำเร็จ', 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว');
      navigation.goBack();
    } catch (error) {
      console.error('Update profile error:', error.response?.data || error.message);
      Alert.alert(
        'บันทึกไม่สำเร็จ',
        error.response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.description}>แก้ไขชื่อ นามสกุล และเบอร์โทรศัพท์ของคุณ</Text>

          <View style={styles.field}>
            <Text style={styles.label}>ชื่อ</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="กรอกชื่อ"
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>นามสกุล</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="กรอกนามสกุล"
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>เบอร์โทรศัพท์</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="กรอกเบอร์โทรศัพท์"
              keyboardType="phone-pad"
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>บันทึกข้อมูล</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
  },
  description: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 24,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    color: '#1E2B58',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    borderRadius: 10,
    borderWidth: 1,
    color: '#1F2937',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 50,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
