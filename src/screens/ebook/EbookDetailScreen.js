import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  ebookService,
  getEbookAssetUrl,
  getFavorites,
  toggleFavoriteEbook,
} from '../../services/ebookService';

export default function EbookDetailScreen({ route, navigation }) {
  const { ebookId } = route.params;
  const [ebook, setEbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    let isActive = true;
    const fetchDetail = async () => {
      try {
        const data = await ebookService.getEbookById(ebookId);
        if (isActive) setEbook(data);
      } catch (error) {
        console.error('Error fetching ebook detail:', error);
        if (isActive) Alert.alert('โหลด E-Book ไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
      } finally {
        if (isActive) setLoading(false);
      }
    };

    const fetchFavoriteStatus = async () => {
      try {
        const favorites = await getFavorites();
        if (isActive) {
          setIsFavorite(Array.isArray(favorites) && favorites.some((favorite) => favorite.id === ebookId));
        }
      } catch (error) {
        console.error('Error fetching favorite status:', error);
      }
    };

    fetchDetail();
    fetchFavoriteStatus();

    return () => {
      isActive = false;
    };
  }, [ebookId]);

  const handleToggleFavorite = async () => {
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      const result = await toggleFavoriteEbook(ebookId);
      setIsFavorite(result.isFavorite);
    } catch (error) {
      console.error('Toggle ebook favorite error:', error);
      Alert.alert('อัปเดตรายการโปรดไม่สำเร็จ', 'กรุณาเข้าสู่ระบบและลองอีกครั้ง');
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#0066CC" style={{ flex: 1 }} />;
  if (!ebook) return <View style={styles.container}><Text>ไม่พบข้อมูล E-Book</Text></View>;

  const fullPdfUrl = getEbookAssetUrl(ebook.pdfUrl || ebook.fileUrl);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: getEbookAssetUrl(ebook.coverUrl) || 'https://via.placeholder.com/150' }}
          style={styles.cover}
          resizeMode="contain"
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}
          disabled={favoriteLoading}
        >
          {favoriteLoading ? (
            <ActivityIndicator size="small" color="#E11D48" />
          ) : (
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={26}
              color={isFavorite ? '#E11D48' : '#6B7280'}
            />
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>{ebook.title}</Text>
      <Text style={styles.author}>ผู้แต่ง: {ebook.authorName || ebook.author || 'ไม่ระบุ'}</Text>
      {!!(ebook.category || ebook.Category?.name) && (
        <Text style={styles.category}>หมวดหมู่: {ebook.category || ebook.Category.name}</Text>
      )}
      {!!ebook.description && <Text style={styles.description}>{ebook.description}</Text>}

      {!!fullPdfUrl && (
        <TouchableOpacity
          style={styles.readButton}
          onPress={() => navigation.navigate('PdfViewer', { pdfUrl: fullPdfUrl, title: ebook.title })}
        >
          <Text style={styles.readButtonText}>เปิดอ่านเอกสาร (PDF)</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FFF' },
  coverContainer: { position: 'relative' },
  cover: { width: '100%', height: 260, marginBottom: 16 },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  author: { fontSize: 14, color: '#666', marginBottom: 20 },
  category: { fontSize: 14, color: '#1E3A8A', marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 22, color: '#374151', marginBottom: 20 },
  readButton: { backgroundColor: '#0066CC', padding: 14, borderRadius: 8, alignItems: 'center' },
  readButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});