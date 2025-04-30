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
  TextInput,
  ImageErrorEventData,
  NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../../firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
  DocumentData,
} from 'firebase/firestore';
import { signOut, User } from 'firebase/auth';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { ImagePickerResult, ImagePickerAsset } from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import ListingModal from '../../components/ListingModal';

// Type definitions
interface ClosetItem {
  id: string;
  title: string;
  category: string;
  size: string;
  price: number;
  availability: boolean;
  imageUrl?: string;
  description: string;
  color: string;
  url?: string;
}

interface UserData {
  username?: string;
  avatarUrl?: string;
  bio?: string;
  borrowedCount?: number;
  lentCount?: number;
  reviewCount?: number;
  totalRating?: number;
  rating?: number;
  email?: string;
  createdAt?: any;
}

// Constants
const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_MARGIN = 16;
const NUM_COLUMNS = 2;
const ITEM_SIZE = (SCREEN_WIDTH - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

// Styles
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF',
  },
  header: { 
    height: 220, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    position: 'absolute',
    top: 160,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#FFF',
    backgroundColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6C63FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  editAvatarIcon: {
    color: '#FFF',
    fontSize: 20,
  },
  username: { 
    fontSize: 26, 
    fontWeight: '700', 
    color: '#111827',
    textAlign: 'center',
  },
  bio: { 
    fontSize: 15, 
    color: '#4B5563', 
    marginTop: 8, 
    textAlign: 'center', 
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 120,
    paddingTop: 30,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flex: 1,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#111827' 
  },
  statLabel: { 
    fontSize: 13, 
    color: '#6B7280', 
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    marginTop: 8,
    marginHorizontal: 20,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  closetList: { 
    paddingHorizontal: 16, 
    paddingTop: 8, 
    paddingBottom: 100,
    flex: 1,
  },
  closetItem: {
    width: ITEM_SIZE,
    margin: ITEM_MARGIN / 2,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  closetImage: {
    width: '100%',
    height: ITEM_SIZE * 0.8,
    backgroundColor: '#EEE',
  },
  itemInfoContainer: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemSize: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: '700',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  availabilityText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  signOutButton: {
    marginHorizontal: 20,
    marginVertical: 24,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  editModal: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 1000,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#6C63FF',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    width: '100%',
  },
  editProfileButton: {
    position: 'absolute',
    right: 0,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editProfileText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default function ProfileScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState<string>('');
  const [stats, setStats] = useState<{ borrowed: number; lent: number; rating: number }>({ 
    borrowed: 0, 
    lent: 0, 
    rating: 0 
  });
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [newAvatarUrl, setNewAvatarUrl] = useState<string>('');
  const [newBio, setNewBio] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<ClosetItem | null>(null);

  const fetchProfile = async (showFullScreenLoading: boolean = true): Promise<void> => {
    const user: User | null = auth.currentUser;
    if (!user) {
      router.replace('/login');
      return;
    }

    if (showFullScreenLoading) setLoading(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      let userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const userData: UserData = {
          email: user.email || undefined,
          username: user.email?.split('@')[0] || 'User',
          createdAt: serverTimestamp(),
          borrowedCount: 0,
          lentCount: 0,
          rating: 0,
          reviewCount: 0,
          totalRating: 0,
        };
        await setDoc(userRef, userData);
        userSnap = await getDoc(userRef);
      }

      const userData: UserData = userSnap.data() || {};
      
      setUsername(userData.username || user.email?.split('@')[0] || 'User');
      setAvatarUrl(userData.avatarUrl || null);
      setBio(userData.bio || '');

      setNewUsername(userData.username || '');
      setNewAvatarUrl(userData.avatarUrl || '');
      setNewBio(userData.bio || '');

      // Try different collection names
      const collectionNames = ['items', 'posts', 'closet', 'closetItems'];
      
      for (const collectionName of collectionNames) {
        try {
          const itemsRef = collection(db, collectionName);
          const allItemsSnapshot = await getDocs(itemsRef);
          
          console.log(`Checking collection "${collectionName}":`, {
            totalItems: allItemsSnapshot.size,
            items: allItemsSnapshot.docs.map(doc => ({
              id: doc.id,
              data: doc.data()
            }))
          });

          const userItems: ClosetItem[] = allItemsSnapshot.docs
            .filter(doc => {
              const data = doc.data();
              return data.uid === user.uid;
            })
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                title: data.description || '',
                category: data.category || '',
                size: data.size || '',
                price: data.price || 0,
                availability: data.availability || false,
                imageUrl: data.picture || '',
                description: data.description || '',
                color: data.color || '',
                url: data.url || '',
              };
            });

          if (userItems.length > 0) {
            console.log(`Found items in collection "${collectionName}":`, userItems);
            setClosetItems(userItems);
            break;
          }
        } catch (err) {
          console.log(`Error checking collection "${collectionName}":`, err);
        }
      }

      const [borrowedSnap, lentSnap] = await Promise.all([
        getDocs(query(collection(db, 'items'), where('borrowerId', '==', user.uid))),
        getDocs(query(collection(db, 'items'), where('ownerId', '==', user.uid))),
      ]);

      const borrowedCount: number = userData.borrowedCount ?? borrowedSnap.size;
      const lentCount: number = userData.lentCount ?? lentSnap.size;
      const rating: number = userData.reviewCount && userData.reviewCount > 0
        ? (userData.totalRating || 0) / userData.reviewCount
        : userData.rating || 0;

      setStats({ borrowed: borrowedCount, lent: lentCount, rating });
    } catch (err) {
      console.error('Profile fetch error:', err);
      Alert.alert('Error', 'Failed to load profile. Try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const pickAndUploadImage = async (): Promise<void> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to your photos to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const user = auth.currentUser;
        if (!user) return;

        // Show loading indicator
        Alert.alert('Uploading', 'Please wait while we upload your profile picture...', [], { cancelable: false });

        const storage = getStorage();
        const imageRef = ref(storage, `profile_pictures/${user.uid}`);
        
        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        if (!fileInfo.exists) {
          throw new Error('Selected file does not exist');
        }

        // Read the file as base64
        const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Convert base64 to Uint8Array
        const bytes = new Uint8Array(base64.length);
        for (let i = 0; i < base64.length; i++) {
          bytes[i] = base64.charCodeAt(i);
        }

        // Add metadata to the upload
        const metadata = {
          contentType: 'image/jpeg',
          customMetadata: {
            'uploadedBy': user.uid,
            'uploadedAt': new Date().toISOString(),
          },
        };

        try {
          // Upload with metadata
          await uploadBytes(imageRef, bytes, metadata);
          const downloadURL = await getDownloadURL(imageRef);
          
          // Update user document
          await setDoc(doc(db, 'users', user.uid), {
            avatarUrl: downloadURL,
            updatedAt: serverTimestamp(),
          }, { merge: true });
          
          setAvatarUrl(downloadURL);
          Alert.alert('Success', 'Profile picture updated successfully!');
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('Failed to upload image to storage');
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      let errorMessage = 'Failed to upload profile picture. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('storage/unknown')) {
          errorMessage = 'Network error occurred. Please check your internet connection and try again.';
        } else if (error.message.includes('storage/unauthorized')) {
          errorMessage = 'You are not authorized to upload images. Please sign in again.';
        } else if (error.message.includes('storage/canceled')) {
          errorMessage = 'Upload was canceled. Please try again.';
        } else if (error.message.includes('storage/retry-limit-exceeded')) {
          errorMessage = 'Upload failed after multiple attempts. Please try again later.';
        } else if (error.message.includes('Failed to fetch image data')) {
          errorMessage = 'Failed to process the selected image. Please try selecting a different image.';
        } else if (error.message.includes('Failed to upload image to storage')) {
          errorMessage = 'Failed to upload the image. Please check your internet connection and try again.';
        } else if (error.message.includes('Selected file does not exist')) {
          errorMessage = 'The selected image could not be found. Please try selecting a different image.';
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };
  
  const handleUpdateProfile = async (): Promise<void> => {
    const user: User | null = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          username: newUsername,
          avatarUrl: newAvatarUrl,
          bio: newBio,
        },
        { merge: true }
      );
      setEditing(false);
      fetchProfile();
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleItemPress = (item: ClosetItem): void => {
    setSelectedItem(item);
  };

  const handleImageError = (itemId: string): void => {
    setImageLoadErrors(prev => new Set([...prev, itemId]));
  };

  const renderItem = ({ item }: { item: ClosetItem }) => (
    <TouchableOpacity
      style={styles.closetItem}
      onPress={() => handleItemPress(item)}
    >
      {item.imageUrl && !imageLoadErrors.has(item.id) ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.closetImage}
          onError={() => handleImageError(item.id)}
        />
      ) : (
        <View style={[styles.closetImage, { backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#999' }}>No Image</Text>
        </View>
      )}
      <View style={styles.itemInfoContainer}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.itemCategory} numberOfLines={1}>{item.category}</Text>
        <View style={styles.itemDetails}>
          <Text style={styles.itemSize}>{item.size}</Text>
          <Text style={styles.itemPrice}>${item.price}</Text>
        </View>
        <View style={styles.availabilityBadge}>
          <View
            style={[
              styles.availabilityDot,
              { backgroundColor: item.availability ? '#10B981' : '#EF4444' },
            ]}
          />
          <Text style={styles.availabilityText}>
            {item.availability ? 'Available' : 'Unavailable'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6C63FF', '#4A42E8']}
        style={styles.header}
      />
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickAndUploadImage}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar} />
          )}
          <View style={styles.editAvatarButton}>
            <Text style={styles.editAvatarIcon}>✏️</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.nameContainer}>
          <Text style={styles.username}>{username}</Text>
          <TouchableOpacity 
            onPress={() => setEditing(true)}
            style={styles.editProfileButton}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bio}>{bio || 'No bio yet'}</Text>
      </View>

      <View style={styles.statsContainer}>
        {['borrowed', 'lent', 'rating'].map((label, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statNumber}>
              {label === 'rating'
                ? stats.rating
                  ? stats.rating.toFixed(1)
                  : '—'
                : stats[label as keyof typeof stats]}
            </Text>
            <Text style={styles.statLabel}>{label[0].toUpperCase() + label.slice(1)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>My Closet ({closetItems.length})</Text>

      <FlatList
        data={closetItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        style={styles.closetList}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProfile(false)}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6C63FF" />
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={{ color: '#6B7280' }}>No items in your closet yet</Text>
            </View>
          )
        }
      />

      {editing && (
        <View style={styles.editModal}>
          <Text style={styles.editTitle}>Edit Profile</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={newUsername}
            onChangeText={setNewUsername}
            placeholderTextColor="#9CA3AF"
          />
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Bio"
            value={newBio}
            onChangeText={setNewBio}
            multiline
            numberOfLines={4}
            placeholderTextColor="#9CA3AF"
          />
          <View style={styles.editButtonsContainer}>
            <TouchableOpacity
              onPress={() => setEditing(false)}
              style={[styles.editButton, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUpdateProfile}
              style={[styles.editButton, styles.saveButton]}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ListingModal
        visible={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
      />
    </SafeAreaView>
  );
}
