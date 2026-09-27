import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ebookService, getEbookAssetUrl, toggleFavoriteEbook } from '../../services/ebookService';

export default function EbookScreen({ navigation }) {
  const [ebooks, setEbooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchEbooks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ebookService.getEbooks(search, selectedCategoryId);
      setEbooks(data);
      setLoadError(null);
    } catch (error) {
      console.error('Fetch ebooks error:', error);
      setEbooks([]);
      setLoadError('ไม่สามารถโหลดรายการ E-Book ได้ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategoryId]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await ebookService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Fetch ebook categories error:', error);
    }
  }, []);

  const handleSearch = () => {
    setLoading(true);
    fetchEbooks();
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [fetchCategories])
  );

  useFocusEffect(
    useCallback(() => {
      fetchEbooks();
    }, [fetchEbooks])
  );

  const handleCategorySelect = (categoryId) => {
    if (categoryId === selectedCategoryId) {
      fetchEbooks();
      return;
    }
    setSelectedCategoryId(categoryId);
  };

  const handleToggleFavorite = async (id) => {
    try {
      const result = await toggleFavoriteEbook(id);
      setEbooks(prev => prev.map(item => item.id === id ? { ...item, isFavorite: result.isFavorite } : item));
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="ค้นหาหนังสือ ชื่อเรื่อง หรือผู้เขียน"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        style={styles.categoryScroll}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ selected: selectedCategoryId === '' }}
          style={[styles.categoryChip, selectedCategoryId === '' && styles.selectedCategoryChip]}
          onPress={() => handleCategorySelect('')}
        >
          <Text style={[styles.categoryText, selectedCategoryId === '' && styles.selectedCategoryText]}>
            ทั้งหมด
          </Text>
        </TouchableOpacity>
        {categories.map((category) => {
          const categoryId = typeof category === 'string' ? category : category.id;
          const categoryName = typeof category === 'string' ? category : category.name;

          return (
            <TouchableOpacity
              key={categoryId}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCategoryId === categoryId }}
              style={[styles.categoryChip, selectedCategoryId === categoryId && styles.selectedCategoryChip]}
              onPress={() => handleCategorySelect(categoryId)}
            >
              <Text style={[styles.categoryText, selectedCategoryId === categoryId && styles.selectedCategoryText]}>
                {categoryName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={styles.listLoading} />
      ) : (
        <FlatList
          data={ebooks}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>{loadError || 'ไม่พบรายการ E-Book'}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => navigation.navigate('EbookDetail', { ebookId: item.id })}>
                <Image source={{ uri: getEbookAssetUrl(item.coverUrl) || 'https://via.placeholder.com/150' }} style={styles.cover} />
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.author}>{item.authorName || item.author || 'ไม่ระบุผู้แต่ง'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleToggleFavorite(item.id)} style={styles.favButton}>
                <Text style={{ color: item.isFavorite ? 'red' : 'gray' }}>
                  {item.isFavorite ? '❤️ ชื่นชอบ' : '🤍 เพิ่มในรายการโปรด'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 8 },
  searchInput: { backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, margin: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  categoryScroll: { flexGrow: 0, marginBottom: 8 },
  categoryList: { paddingHorizontal: 8 },
  categoryChip: { backgroundColor: '#E5E7EB', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 9, marginRight: 8 },
  selectedCategoryChip: { backgroundColor: '#1E3A8A' },
  categoryText: { color: '#374151', fontSize: 13, fontWeight: '500' },
  selectedCategoryText: { color: '#FFF' },
  listLoading: { marginTop: 24 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { flex: 1, margin: 8, backgroundColor: '#FFF', borderRadius: 10, padding: 10, elevation: 2 },
  cover: { width: '100%', height: 160, borderRadius: 8 },
  title: { fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  author: { fontSize: 12, color: '#6B7280' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999' },
  favButton: { marginTop: 8, alignItems: 'center' },
});