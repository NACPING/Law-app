import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet
} from 'react-native';
import { ebookService, getEbookAssetUrl } from '../../services/ebookService';

export default function EbookListScreen({ navigation }) {
  const [ebooks, setEbooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [categoriesData, ebooksData] = await Promise.all([
        ebookService.getCategories(),
        ebookService.getEbooks(search, selectedCategory)
      ]);
      setCategories(categoriesData);
      setEbooks(ebooksData);
    } catch (error) {
      console.error('Error loading ebooks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderEbookItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EbookDetail', { ebookId: item.id })}
    >
      <Image
        source={{ uri: getEbookAssetUrl(item.coverUrl) || 'https://via.placeholder.com/150' }}
        style={styles.coverImage}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.author}>{item.authorName || item.author || 'ไม่ระบุผู้แต่ง'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ช่องค้นหา */}
      <TextInput
        style={styles.searchInput}
        placeholder="ค้นหาหนังสือ หรือกฎหมาย..."
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={loadData}
      />

      {/* แถบเลือกหมวดหมู่ */}
      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === null && styles.activeChip]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={selectedCategory === null ? styles.activeChipText : styles.chipText}>ทั้งหมด</Text>
        </TouchableOpacity>
        {categories.map((cat) => {
          const categoryValue = typeof cat === 'string' ? cat : cat.id;
          const categoryLabel = typeof cat === 'string' ? cat : cat.name;

          return (
            <TouchableOpacity
              key={categoryValue}
              style={[styles.categoryChip, selectedCategory === categoryValue && styles.activeChip]}
              onPress={() => setSelectedCategory(categoryValue)}
            >
              <Text style={selectedCategory === categoryValue ? styles.activeChipText : styles.chipText}>
                {categoryLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* รายการ E-Book */}
      {loading ? (
        <ActivityIndicator size="large" color="#0066CC" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={ebooks}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderEbookItem}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>ไม่พบรายการ E-Book</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 12 },
  searchInput: { backgroundColor: '#FFF', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#DDD' },
  categoryContainer: { flexDirection: 'row', marginBottom: 12 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E0E0E0', marginRight: 8 },
  activeChip: { backgroundColor: '#0066CC' },
  chipText: { color: '#333' },
  activeChipText: { color: '#FFF', fontWeight: 'bold' },
  listContainer: { paddingBottom: 20 },
  card: { flex: 0.5, backgroundColor: '#FFF', margin: 6, borderRadius: 8, overflow: 'hidden', elevation: 2 },
  coverImage: { width: '100%', height: 180 },
  cardContent: { padding: 8 },
  title: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  author: { fontSize: 12, color: '#666', marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999' }
});