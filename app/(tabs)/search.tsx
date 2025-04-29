// app/(tabs)/search.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ListRenderItem,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig.js';
import { useRouter } from 'expo-router';

interface Item {
  id: string;
  title: string;
  displayTitle?: string;
  category: string;
  description?: string;
  imageUrl: string;
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = async () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const itemsRef = collection(db, 'items');
      const q = query(
        itemsRef,
        where('title', '>=', term),
        where('title', '<=', term + '\uf8ff')
      );
      // ← no generic here
      const snap = await getDocs(q);

      const fetched: Item[] = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title as string,
          displayTitle: data.displayTitle as string | undefined,
          category: data.category as string,
          description: data.description as string | undefined,
          imageUrl: data.imageUrl as string,
        };
      });

      const byDesc = fetched.filter(item =>
        item.description?.toLowerCase().includes(term)
      );

      const all = [...fetched, ...byDesc];
      const unique = Array.from(new Set(all.map(i => i.id))).map(id =>
        all.find(i => i.id === id)!
      );

      setResults(unique);
    } catch (err) {
      console.error(err);
      Alert.alert('Search Error', 'Could not fetch items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(handleSearch, 500);
    return () => clearTimeout(handle);
  }, [searchTerm]);

  const handleItemPress = (item: Item) => {
    // Use a type assertion to handle the router.push parameter
    router.push(`/item/${item.id}` as any);
  };

  const renderItem: ListRenderItem<Item> = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleItemPress(item)}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.resultImage}
      />
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>
          {item.displayTitle ?? item.title}
        </Text>
        <Text style={styles.resultCategory}>{item.category}</Text>
        {item.description ? (
          <Text style={styles.resultDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search items..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={handleSearch}
      />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchTerm ? 'No items found.' : 'Start typing to search.'}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchInput: {
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    fontSize: 16,
  },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 16 },
  resultItem: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultImage: {
    width: 60,
    height: 60,
    backgroundColor: '#E5E7EB',
  },
  resultInfo: {
    flex: 1,
    padding: 8,
  },
  resultTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  resultCategory: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  resultDescription: { fontSize: 14, color: '#4B5563' },
  emptyText: { textAlign: 'center', marginTop: 32, color: '#6B7280' },
});
