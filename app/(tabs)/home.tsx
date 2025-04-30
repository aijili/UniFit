// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';

// export default function HomeScreen() {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Home</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//   },
// }); 
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
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig.js';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (width - CARD_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

const CATEGORIES = ['All', 'Formal', 'Casual'];

interface Item {
  id: string;
  imageUrl: string;
  title: string;
  category: string;
  color: string;
  available: boolean;
}

export default function HomeScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [filtered, setFiltered] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // fetch all items from Firestore
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'items'));
        if (isMounted) {
          const data = snap.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          })) as Item[];
          setItems(data);
          setFiltered(data);
        }
      } catch (err) {
        console.error('Error loading home items:', err);
        if (isMounted) {
          Alert.alert(
            'Error',
            'Failed to load items. Please check your connection and try again.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false };
  }, []);
  // apply search + category filter
  useEffect(() => {
    let result = items;

    if (category !== 'All') {
      result = result.filter(item => item.category === category);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(term)
      );
    }

    setFiltered(result);
  }, [items, searchTerm, category]);

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.card}>
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.image}
        defaultSource={require('../../assets/images/icon.png')}
        onError={() => console.log('Image failed to load')}
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
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

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
          placeholder="Search"
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.chipRow}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.chip,
              category === cat && styles.chipActive,
            ]}
            onPress={() => setCategory(cat)}
          >
            <Text
              style={[
                styles.chipText,
                category === cat && styles.chipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.chip}>
          <Text style={styles.chipText}>＋</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    paddingVertical: 8,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: CARD_MARGIN,
    marginBottom: CARD_MARGIN,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#6C63FF',
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  list: {
    paddingHorizontal: CARD_MARGIN,
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
  available: { color: '#10B981', backgroundColor: '#D1FAE5' },
  borrowed: { color: '#EF4444', backgroundColor: '#FEE2E2' },
});