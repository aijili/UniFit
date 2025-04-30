// app/(tabs)/search.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  FlatList,
  Image,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (width - CARD_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

interface Item {
  id: string;
  imageUrl: string;
  title: string;
  category: string;
  color: string;
  available: boolean;
}

export default function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const itemsRef = collection(db, 'items');
      const q = query(
        itemsRef,
        where('title', '>=', term.toLowerCase()),
        where('title', '<=', term.toLowerCase() + '\uf8ff')
      );
      const snap = await getDocs(q);
      const items = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Item[];
      setResults(items);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push('/item/' + item.id as any)}
    >
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.image}
        defaultSource={require('../../assets/images/icon.png')}
      />
      <Text style={styles.occasion}>{item.category}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <View style={styles.bottomRow}>
        <Text style={styles.tag}>{item.color}</Text>
        <Text
          style={[
            styles.badge,
            item.available ? styles.available : styles.borrowed,
          ]}
        >
          {item.available ? 'Available' : 'Borrowed'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color="#9CA3AF"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchTerm}
          onChangeText={handleSearch}
          placeholderTextColor="#9CA3AF"
          autoFocus
        />
        {searchTerm ? (
          <TouchableOpacity 
            onPress={() => handleSearch('')}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searchTerm ? (
              <Text style={styles.emptyText}>No items found</Text>
            ) : (
              <Text style={styles.emptyText}>Start typing to search...</Text>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    margin: CARD_MARGIN,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    height: '100%',
  },
  clearButton: {
    marginLeft: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: CARD_MARGIN,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#6B7280',
    fontSize: 16,
  },
  card: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: CARD_WIDTH,
  },
  occasion: {
    marginTop: 8,
    marginHorizontal: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  title: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 8,
  },
  tag: {
    fontSize: 12,
    color: '#6B7280',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  badge: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  available: {
    color: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  borrowed: {
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
});
