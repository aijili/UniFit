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
  Linking,
} from 'react-native';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (width - CARD_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

const CATEGORIES = ['All', 'Formal', 'Casual'];

interface Post {
  id: string;
  availability: boolean;
  category: string;
  color: string;
  description: string;
  picture: string;
  price: number;
  size: string;
  uid: string;
  url: string;
}

export default function HomeScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postLoading, setPostLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        console.log('Fetching posts from Firestore...');
        const postsRef = collection(db, 'posts');
        const postSnap = await getDocs(postsRef);
        
        console.log('Found', postSnap.size, 'posts');
        
        if (isMounted) {
          const postData = postSnap.docs.map(doc => {
            const data = doc.data();
            console.log('Raw post data:', data);
            return {
              id: doc.id,
              availability: data.availability ?? true,
              category: data.category?.toLowerCase() || 'other',
              color: data.color?.toLowerCase() || 'unknown',
              description: data.description || 'No description',
              picture: data.picture || '',
              price: data.price || 0,
              size: data.size?.toUpperCase() || 'N/A',
              uid: data.uid || '',
              url: data.url || '',
            } as Post;
          });
          
          console.log('Processed posts:', postData);
          setPosts(postData);
        }
      } catch (err) {
        console.error('Firestore error:', err);
        Alert.alert(
          'Error',
          'Failed to load posts. Please check your connection.'
        );
      } finally {
        if (isMounted) setPostLoading(false);
      }
    })();
    return () => { isMounted = false };
  }, []);

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => {
        if (item.url) Linking.openURL(item.url);
      }}
    >
      <View style={styles.postHeader}>
        <Text style={styles.postCategory}>{item.category}</Text>
        <Text style={styles.postPrice}>${item.price}</Text>
      </View>
      
      {item.picture ? (
        <Image 
          source={{ uri: item.picture }} 
          style={styles.postImage}
          resizeMode="cover"
          onError={() => console.log('Failed to load image')}
        />
      ) : (
        <View style={[styles.postImage, styles.emptyImage]}>
          <Ionicons name="image-outline" size={40} color="#9CA3AF" />
        </View>
      )}

      <Text style={styles.postTitle}>{item.description}</Text>
      
      <View style={styles.postDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Size:</Text>
          <Text style={styles.detailValue}>{item.size}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Color:</Text>
          <Text style={styles.detailValue}>{item.color}</Text>
        </View>
        <Text style={[
          styles.badge,
          item.availability ? styles.available : styles.borrowed
        ]}>
          {item.availability ? 'Available' : 'Unavailable'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const filteredPosts = posts.filter(post => {
    console.log('Filtering post:', post);
    console.log('Current category:', category);
    console.log('Current search term:', searchTerm);
    
    const matchesCategory = category === 'All' || post.category === category.toLowerCase();
    const matchesSearch = !searchTerm || post.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    console.log('Matches category:', matchesCategory);
    console.log('Matches search:', matchesSearch);
    
    return matchesCategory && matchesSearch;
  });

  console.log('Filtered posts length:', filteredPosts.length);

  if (postLoading) {
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
            <Text style={[
              styles.chipText,
              category === cat && styles.chipTextActive,
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No posts found matching your criteria</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
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
  postCard: {
    margin: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postCategory: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  postPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
    lineHeight: 24,
  },
  postDetails: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    textTransform: 'capitalize',
  },
  badge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4,
  },
  available: { 
    color: '#10B981', 
    backgroundColor: '#D1FAE5' 
  },
  borrowed: { 
    color: '#EF4444', 
    backgroundColor: '#FEE2E2' 
  },
  emptyImage: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#6B7280',
    fontSize: 16,
  }
});