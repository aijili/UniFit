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
import { doc, getDoc, collection, getDocs, query, where, setDoc, serverTimestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { router } from 'expo-router';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_MARGIN = 16;
const NUM_COLUMNS = 2;
const ITEM_SIZE = (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

// Define the ClosetItem interface
interface ClosetItem {
  id: string;
  title: string;
  imageUrl?: string; // Make imageUrl optional
  [key: string]: any; // For other properties that might be in the item
}

interface Post {
  id: string;
  picture: string;
  category: string;
  color: string;
  size: string;
  description: string;
  price: number;
  url: string;
  availability: boolean;
  createdAt: any;
}

interface UserData {
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  createdAt: any;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  const fetchProfile = async (showFullScreenLoading = true): Promise<Unsubscribe | undefined> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.replace('/login');
      return;
    }

    if (showFullScreenLoading) {
      setLoading(true);
    }

    try {
      // Get user data
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        router.push('/onboarding');
        return;
      }

      const userData = userSnap.data() as UserData;
      setUserData(userData);
      setUser(currentUser);

      // Set up real-time listener for user's posts
      const postsQuery = query(
        collection(db, 'posts'),
        where('ownerId', '==', currentUser.uid)
      );

      const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
        const userPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        setPosts(userPosts);
      });

      return unsubscribe;

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
    let unsubscribe: Unsubscribe | undefined;
    
    const setupProfile = async () => {
      unsubscribe = await fetchProfile();
    };
    
    setupProfile();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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

  const handlePostPress = (post: Post) => {
    router.push(`/post/${post.id}` as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const renderPost: ListRenderItem<Post> = ({ item }) => (
    <TouchableOpacity 
      style={styles.postItem}
      onPress={() => handlePostPress(item)}
    >
      <Image
        source={{ uri: item.picture }}
        style={styles.postImage}
      />
      <View style={styles.postInfo}>
        <Text style={styles.postCategory}>{item.category}</Text>
        <Text style={styles.postPrice}>${item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6C63FF"
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#6C63FF', '#8B85FF']}
            style={styles.gradient}
          >
            <Image
              source={{ uri: userData?.avatarUrl || 'https://via.placeholder.com/150' }}
              style={styles.profileImage}
            />
            <Text style={styles.username}>{userData?.username}</Text>
            <Text style={styles.name}>
              {userData?.firstName} {userData?.lastName}
            </Text>
          </LinearGradient>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {posts.filter(post => post.availability).length}
            </Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        {/* Posts Grid */}
        <View style={styles.postsContainer}>
          <Text style={styles.sectionTitle}>My Items</Text>
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={item => item.id}
            numColumns={NUM_COLUMNS}
            scrollEnabled={false}
            contentContainerStyle={styles.postsGrid}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No items posted yet.
                </Text>
              </View>
            }
          />
        </View>
      </ScrollView>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  gradient: {
    padding: 20,
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  name: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#FFF',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  postsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  postsGrid: {
    paddingBottom: 80, // Space for logout button
  },
  postItem: {
    width: ITEM_SIZE,
    margin: ITEM_MARGIN / 2,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  postImage: {
    width: '100%',
    height: ITEM_SIZE,
    backgroundColor: '#EEE',
  },
  postInfo: {
    padding: 8,
  },
  postCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  postPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  logoutButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
