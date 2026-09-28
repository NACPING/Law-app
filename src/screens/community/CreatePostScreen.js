import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { createPost } from '../../services/communityService';

export default function CreatePostScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกหัวข้อและเนื้อหา');
      return;
    }

    setPosting(true);
    try {
      await createPost({
        title: title.trim(),
        content: content.trim(),
        isAnonymous,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Create post error:', error.response?.data || error.message);
      Alert.alert(
        'สร้างกระทู้ไม่สำเร็จ',
        error.response?.data?.error || error.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Feather name="x" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity style={styles.postButton} onPress={handlePost} disabled={posting}>
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          
          <TextInput
            style={styles.titleInput}
            placeholder="Title (e.g. ปรึกษาปัญหาชีวิตประจำวัน)"
            placeholderTextColor="#888"
            value={title}
            onChangeText={setTitle}
          />
          
          <View style={styles.divider} />
          
          <TextInput
            style={styles.contentInput}
            placeholder="What do you want to ask or share?"
            placeholderTextColor="#a0a0a0"
            multiline
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
          />

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionIcon}>
              <Feather name="image" size={24} color="#1E2B58" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon}>
              <Feather name="paperclip" size={24} color="#1E2B58" />
            </TouchableOpacity>
            
            <View style={{ flex: 1 }} />
            
            <View style={styles.anonymousRow}>
              <Text style={styles.anonymousText}>Post Anonymously</Text>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: '#d3d3d3', true: '#1E2B58' }}
                thumbColor={isAnonymous ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  iconButton: {
    padding: 5,
  },
  postButton: {
    backgroundColor: '#1E2B58',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    padding: 20,
    flexGrow: 1,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    minHeight: 200,
    lineHeight: 24,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 'auto', // Push to bottom of scrollview if content is small
  },
  actionIcon: {
    padding: 10,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  anonymousRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonymousText: {
    fontSize: 14,
    color: '#555',
    marginRight: 10,
  }
});
