import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { ebookService } from '../../services/ebookService';
import apiClient from '../../services/apiClient';

export default function EbookListScreen({ navigation }) {
  const [ebooks, setEbooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // null = เลือก "ทั้งหมด"
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const getFullUrl = (path) =>
    path?.startsWith('http') ? path : `${apiClient.defaults.baseURL || 'http://localhost:5000'}${path}`;

  // 1. ดึงหมวดหมู่ทั้งหมดมาจาก Backend ตอนเปิดหน้าจอ
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await ebookService.getCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // 2. ดึงรายการหนังสือตาม Search หรือ Category ที่เลือก
  useEffect(() => {
    const fetchEbooks = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedCategory) params.category = selectedCategory;
        if (search) params.search = search;
        const data = await ebookService.getEbooks(params);
        setEbooks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching ebooks:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEbooks();
  }, [selectedCategory, search]);

  return (
    <View style={styles.container}>
      {/* ช่องค้นหา */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาหนังสือ ชื่อเรื่อง หรือผู้เขียน"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* แถบหมวดหมู่ (Category Chips) */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.chip, selectedCategory === null && styles.activeChip]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.chipText, selectedCategory === null && styles.activeChipText]}>
              ทั้งหมด
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, selectedCategory === cat.id && styles.activeChip]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.chipText, selectedCategory === cat.id && styles.activeChipText]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* รายการหนังสือ */}
      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={ebooks}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('EbookDetail', { ebookId: item.id })}
            >
              <Image source={{ uri: getFullUrl(item.coverUrl) }} style={styles.cover} />
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.author}>{item.authorName || item.author || 'ไม่ระบุผู้แต่ง'}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>ไม่พบหนังสือในหมวดหมู่นี้</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 12 },
  searchContainer: { marginBottom: 10 },
  searchInput: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryContainer: { marginBottom: 12, maxHeight: 40 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 8,
  },
  activeChip: { backgroundColor: '#1E3A8A' },
  chipText: { fontSize: 13, color: '#334155' },
  activeChipText: { color: '#FFF', fontWeight: 'bold' },
  card: {
    flex: 0.5,
    backgroundColor: '#FFF',
    margin: 4,
    borderRadius: 8,
    padding: 8,
    elevation: 1,
  },
  cover: { width: '100%', height: 140, borderRadius: 6, resizeMode: 'cover' },
  title: { fontSize: 14, fontWeight: 'bold', marginTop: 8, color: '#1E293B' },
  author: { fontSize: 12, color: '#64748B', marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8' },
});