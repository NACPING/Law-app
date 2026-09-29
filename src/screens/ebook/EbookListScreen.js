import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ebookService, getEbookAssetUrl } from '../../services/ebookService';

export default function EbookListScreen({ navigation }) {
  const [ebooks, setEbooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchEbooks = async () => {
      try {
        const data = await ebookService.getEbooks();
        setEbooks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching ebooks:', err);
        setEbooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEbooks();
  }, []);

  const filteredEbooks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

    return ebooks.filter((ebook) => {
      const title = typeof ebook.title === 'string' ? ebook.title : '';
      const categoryName = ebook.category
        || ebook.Category?.name
        || categories.find((category) => (
          typeof category !== 'string' && category.id === ebook.categoryId
        ))?.name
        || '';

      const matchesSearch = title.toLocaleLowerCase().includes(normalizedQuery);
      const matchesCategory = selectedCategory === 'ทั้งหมด' || categoryName === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [ebooks, categories, searchQuery, selectedCategory]);

  return (
    <View style={styles.container}>
      {/* ช่องค้นหา */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาชื่อหนังสือ"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          accessibilityLabel="ค้นหาชื่อหนังสือ"
        />
      </View>

      {/* แถบหมวดหมู่ (Category Chips) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ selected: selectedCategory === 'ทั้งหมด' }}
          style={[styles.chip, selectedCategory === 'ทั้งหมด' && styles.activeChip]}
          onPress={() => setSelectedCategory('ทั้งหมด')}
        >
          <Text style={[styles.chipText, selectedCategory === 'ทั้งหมด' && styles.activeChipText]}>
            ทั้งหมด
          </Text>
        </TouchableOpacity>

        {categories.map((category) => {
          const categoryName = typeof category === 'string' ? category : category.name;
          if (!categoryName) return null;

          return (
            <TouchableOpacity
              key={typeof category === 'string' ? category : category.id || categoryName}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCategory === categoryName }}
              style={[styles.chip, selectedCategory === categoryName && styles.activeChip]}
              onPress={() => setSelectedCategory(categoryName)}
            >
              <Text style={[styles.chipText, selectedCategory === categoryName && styles.activeChipText]}>
                {categoryName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* รายการหนังสือ */}
      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredEbooks}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('EbookDetail', { ebookId: item.id })}
            >
              <Image
                source={{ uri: getEbookAssetUrl(item.coverUrl) || 'https://via.placeholder.com/150' }}
                style={styles.cover}
              />
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.author}>{item.authorName || item.author || 'ไม่ระบุผู้แต่ง'}</Text>
              <Text style={styles.category}>
                {item.category || item.Category?.name || 'ไม่ระบุหมวดหมู่'}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>ไม่พบหนังสือที่ตรงกับการค้นหาหรือหมวดหมู่นี้</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 12 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#1E293B',
    paddingLeft: 8,
    paddingVertical: 8,
  },
  categoryContainer: { flexGrow: 0, marginBottom: 12 },
  categoryContent: { alignItems: 'center' },
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
  category: { fontSize: 11, color: '#1E3A8A', marginTop: 5 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8' },
});