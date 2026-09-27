import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { ebookService, getEbookAssetUrl } from '../../services/ebookService';

export default function EbookDetailScreen({ route, navigation }) {
  const { ebookId } = route.params;
  const [ebook, setEbook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await ebookService.getEbookById(ebookId);
        setEbook(data);
      } catch (error) {
        console.error('Error fetching ebook detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [ebookId]);

  if (loading) return <ActivityIndicator size="large" color="#0066CC" style={{ flex: 1 }} />;
  if (!ebook) return <View style={styles.container}><Text>ไม่พบข้อมูล E-Book</Text></View>;

  const fullPdfUrl = getEbookAssetUrl(ebook.pdfUrl || ebook.fileUrl);

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: getEbookAssetUrl(ebook.coverUrl) || 'https://via.placeholder.com/150' }}
        style={styles.cover}
        resizeMode="contain"
      />
      <Text style={styles.title}>{ebook.title}</Text>
      <Text style={styles.author}>ผู้แต่ง: {ebook.authorName || ebook.author || 'ไม่ระบุ'}</Text>

      <TouchableOpacity
        style={styles.readButton}
        onPress={() => navigation.navigate('PdfViewer', { pdfUrl: fullPdfUrl, title: ebook.title })}
      >
        <Text style={styles.readButtonText}>เปิดอ่านเอกสาร (PDF)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FFF' },
  cover: { width: '100%', height: 260, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  author: { fontSize: 14, color: '#666', marginBottom: 20 },
  readButton: { backgroundColor: '#0066CC', padding: 14, borderRadius: 8, alignItems: 'center' },
  readButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});