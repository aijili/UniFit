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
  ScrollView,
  Modal,
} from 'react-native';
import { collection, getDocs, getDoc, doc, setDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import ListingModal from '../../components/ListingModal';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (width - CARD_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

const CATEGORIES = [
  'All',
  'Formal',
  'Casual',
  'Going Out',
  'Athleisure',
  'Loungewear',
  'Outerwear',
  'Vacation',
  'Workwear',
  'Costume'
];

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
  username?: string;
  avatarUrl?: string;
}

export default function HomeScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [posts, setPosts] = useState<Post[]>([]);
  const [postLoading, setPostLoading] = useState(true);
  const [borrowModalVisible, setBorrowModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [borrowDays, setBorrowDays] = useState('');
  const [borrowLoading, setBorrowLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        console.log('Fetching posts from Firestore...');
        const postsRef = collection(db, 'posts');
        const postSnap = await getDocs(postsRef);
        
        console.log('Found', postSnap.size, 'posts');
        
        const postData = await Promise.all(
          postSnap.docs.map(async docSnap => {
            const data = docSnap.data();
            console.log('Raw post data:', data);
            let username = '';
            let avatarUrl = '';
            if (data.uid) {
              const userDoc = await getDoc(doc(db, 'users', data.uid));
              if (userDoc.exists()) {
                username = userDoc.data().username || '';
                avatarUrl = userDoc.data().avatarUrl || '';
              }
            }
            return {
              id: docSnap.id,
              availability: data.availability ?? true,
              category: data.category?.toLowerCase() || 'other',
              color: data.color?.toLowerCase() || 'unknown',
              description: data.description || 'No description',
              picture: data.picture || '',
              price: data.price || 0,
              size: data.size?.toUpperCase() || 'N/A',
              uid: data.uid || '',
              url: data.url || '',
              username,
              avatarUrl,
            } as Post;
          })
        );
        
        console.log('Processed posts:', postData);
        if (isMounted) setPosts(postData);
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

  const handleBorrow = (post: Post) => {
    setSelectedPost(post);
    setBorrowDays('');
    setBorrowModalVisible(true);
  };

  const submitBorrowRequest = async () => {
    if (!selectedPost || !borrowDays) return;
    setBorrowLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      await addDoc(collection(db, 'borrowRequests'), {
        itemId: selectedPost.id,
        ownerId: selectedPost.uid,
        borrowerId: user.uid,
        status: 'pending',
        days: parseInt(borrowDays),
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Request Sent', 'Your borrow request has been sent!');
      setBorrowModalVisible(false);
    } catch (err) {
      console.error('Borrow request error:', err);
      Alert.alert('Error', 'Failed to send borrow request.');
    } finally {
      setBorrowLoading(false);
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    const user = auth.currentUser;
    const isOwner = user && item.uid === user.uid;
    const isAvailable = item.availability;
    return (
      <TouchableOpacity 
        style={styles.postCard}
        onPress={() => {
          if (item.url) Linking.openURL(item.url);
        }}
      >
        <View style={styles.userHeader}>
          <Image
            source={{ uri: item.avatarUrl || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
          <Text style={styles.username}>{item.username || 'Unknown'}</Text>
        </View>
        
        <View style={styles.postHeader}>
          <Text style={styles.postCategory}>{item.category}</Text>
          <Text style={styles.postPrice}>${item.price} / day</Text>
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
        {/* Borrow button for non-owners and only if available */}
        {!isOwner && isAvailable && (
          <TouchableOpacity
            style={styles.borrowBtn}
            onPress={() => handleBorrow(item)}
          >
            <Text style={styles.borrowBtnText}>Borrow</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

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

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
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
      </ScrollView>

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
      {/* Borrow Modal */}
      <Modal
        visible={borrowModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBorrowModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Borrow Item</Text>
            <Text style={{ marginBottom: 8 }}>How many days do you want to borrow this item?</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 16 }}
              placeholder="Number of days"
              keyboardType="numeric"
              value={borrowDays}
              onChangeText={setBorrowDays}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => setBorrowModalVisible(false)} style={{ flex: 1, marginRight: 8, backgroundColor: '#F3F4F6', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ color: '#6B7280', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#6C63FF', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}
                onPress={submitBorrowRequest}
                disabled={borrowLoading || !borrowDays}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>{borrowLoading ? 'Sending...' : 'Send Request'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 12,
    marginBottom: 12,
    minHeight: 50,
    maxHeight:50
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 80,
  },
  chipActive: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#6C63FF',
    marginRight: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 80,
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
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
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#EEE',
  },
  username: {
    fontWeight: '600',
    color: '#333',
    fontSize: 14,
  },
  borrowBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  borrowBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});