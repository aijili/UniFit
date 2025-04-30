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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [stats, setStats] = useState({ borrowed: 0, lent: 0, rating: 0 });
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  const fetchProfile = async (showFullScreenLoading = true) => {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/login');
      return;
    }

    if (showFullScreenLoading) {
      setLoading(true);
    }

    try {
      // 1) get user doc
      const userRef = doc(db, 'users', user.uid);
      let userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          email: user.email,
          username: user.email?.split('@')[0] || 'User',
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

      setUsername(userData.username || user.email?.split('@')[0] || 'User');
      setAvatarUrl(userData.avatarUrl || null);
      
      // 2) get user stats
      const itemsRef = collection(db, 'items');
      const [borrowedSnap, lentSnap] = await Promise.all([
        getDocs(query(itemsRef, where('borrowerId', '==', user.uid))),
        getDocs(query(itemsRef, where('ownerId', '==', user.uid))),
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

  const handleSignOut = async () => {
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
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            {/* gradient header */}
            <LinearGradient
              colors={['#6FE7DD', '#6C63FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            />

            {/* avatar & name */}
            <View style={styles.avatarContainer}>
              <Image
                source={
                  avatarUrl
                    ? { uri: avatarUrl }
                    : require('../../assets/images/icon.png')
                }
                style={styles.avatar}
                onError={() => setAvatarUrl(null)}
              />
              <Text style={styles.username}>{username}</Text>
            </View>

            {/* stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.borrowed}</Text>
                <Text style={styles.statLabel}>Borrowed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.lent}</Text>
                <Text style={styles.statLabel}>Lent</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {stats.rating ? stats.rating.toFixed(1) : '—'}
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>

            {/* closet title */}
            <Text style={styles.sectionTitle}>
              My Closet ({closetItems.length})
            </Text>
          </>
        }
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
        ListFooterComponent={
          <TouchableOpacity 
            style={styles.signOutButton} 
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF' 
  },
  header: {
    height: 180,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#FFF',
    backgroundColor: '#EEE',
  },
  username: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  statCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionTitle: {
    marginTop: 32,
    marginHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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
  signOutButton: {
    marginHorizontal: 16,
    marginVertical: 24,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
