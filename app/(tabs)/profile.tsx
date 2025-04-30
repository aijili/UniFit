import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ListRenderItem,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../../firebaseConfig.js';
import { doc, getDoc, collection, getDocs, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { router } from 'expo-router';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_MARGIN = 16;
const NUM_COLUMNS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

// Define the ClosetItem interface
interface ClosetItem {
  id: string;
  title: string;
  imageUrl?: string; // Make imageUrl optional
  [key: string]: any; // For other properties that might be in the item
}

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [stats, setStats] = useState({ borrowed: 0, lent: 0, rating: 0 });
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  const fetchProfile = async (showFullScreenLoading = true) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.replace('/login');
      return;
    }

    if (showFullScreenLoading) {
      setLoading(true);
    }

    try {
      // 1) get user doc
      const userRef = doc(db, 'users', currentUser.uid);
      let userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          email: currentUser.email,
          username: currentUser.email?.split('@')[0] || 'User',
          createdAt: serverTimestamp(),
          borrowedCount: 0,
          lentCount: 0,
          rating: 0,
          reviewCount: 0,
          totalRating: 0
        });
        // Get the newly created document
        userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          throw new Error('Failed to create user document');
        }
      }

      const userData = userSnap.data();
      if (!userData) {
        throw new Error('User data is undefined');
      }

      setUsername(userData.username || currentUser.email?.split('@')[0] || 'User');
      setAvatarUrl(userData.avatarUrl || null);
      
      // 2) get user stats
      const itemsRef = collection(db, 'items');
      const [borrowedSnap, lentSnap] = await Promise.all([
        getDocs(query(itemsRef, where('borrowerId', '==', currentUser.uid))),
        getDocs(query(itemsRef, where('ownerId', '==', currentUser.uid))),
      ]);

      // Use stored counts if they exist, otherwise use real-time counts
      const borrowedCount = userData.borrowedCount ?? borrowedSnap.size;
      const lentCount = userData.lentCount ?? lentSnap.size;
      
      // Calculate rating from reviews if they exist
      let rating = userData.rating || 0;
      if (userData.reviewCount) {
        rating = (userData.totalRating || 0) / userData.reviewCount;
      }

      setStats({
        borrowed: borrowedCount,
        lent: lentCount,
        rating,
      });

      // 3) get user's items
      const userItems = lentSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          title: data.displayTitle || data.title,
        } as ClosetItem;
      });
      setClosetItems(userItems);

      // Fetch user's posts
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', currentUser.uid)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const userPosts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(userPosts);

    } catch (err) {
      console.error('Profile fetch error:', err);
      Alert.alert(
        'Error',
        'Failed to load profile data. Pull down to refresh or try again later.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfile(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleImageError = (itemId: string) => {
    setImageLoadErrors(prev => new Set([...prev, itemId]));
  };

  const handleItemPress = (item: ClosetItem) => {
    // Use a type assertion to handle the router.push parameter
    router.push(`/item/${item.id}` as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const renderItem: ListRenderItem<ClosetItem> = ({ item }) => (
    <TouchableOpacity 
      style={styles.closetItem}
      onPress={() => handleItemPress(item)}
    >
      <Image
        source={
          imageLoadErrors.has(item.id)
            ? require('../../assets/images/icon.png')
            : { uri: item.imageUrl }
        }
        style={styles.closetImage}
        onError={() => handleImageError(item.id)}
      />
      <Text style={styles.itemTitle} numberOfLines={1}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: avatarUrl || 'https://via.placeholder.com/150' }}
          style={styles.profileImage}
        />
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.borrowed}</Text>
          <Text style={styles.statLabel}>Borrowed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.lent}</Text>
          <Text style={styles.statLabel}>Lent</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {stats.rating ? stats.rating.toFixed(1) : '—'}
          </Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.postsGrid}>
        {posts.map((post) => (
          <TouchableOpacity key={post.id} style={styles.postItem}>
            <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.closetList}>
        <Text style={styles.sectionTitle}>
          My Closet ({closetItems.length})
        </Text>
        <FlatList
          data={closetItems}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.closetList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6C63FF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No items in your closet yet.
              </Text>
            </View>
          }
        />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
  },
  postItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 2,
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  closetList: {
    paddingHorizontal: ITEM_MARGIN,
    paddingTop: 12,
    paddingBottom: 80, // Space for sign out button
  },
  closetItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE + 24, // Extra space for title
    margin: ITEM_MARGIN / 2,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    padding: 8,
  },
  closetImage: {
    width: '100%',
    height: ITEM_SIZE - 16,
    borderRadius: 8,
    backgroundColor: '#EEE',
  },
  itemTitle: {
    fontSize: 12,
    color: '#111827',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginTop: 32,
    marginHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
});
