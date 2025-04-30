import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Modal,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { auth, db, storage } from '../../firebaseConfig.js';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  ref as firebaseStorageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const NUM_COLUMNS = 3;
const CARD_WIDTH = (width - CARD_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

// Define the Asset type based on MediaLibrary.Asset
type Asset = MediaLibrary.Asset;

export default function PostUploadScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setModalVisible(true);
        setLoading(false);
        return;
      }
      fetchAssets();
    })();
  }, []);

  const fetchAssets = async () => {
    try {
      const { assets: photos } = await MediaLibrary.getAssetsAsync({
        first: 50,
        mediaType: ['photo'],
        sortBy: [['creationTime', false]],
      });
      setAssets(photos);
    } catch (err) {
      console.error('Error loading photos:', err);
      Alert.alert(
        'Error',
        'Failed to load photos. Please check your permissions and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selected) return;
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your item');
      return;
    }
    if (!category.trim()) {
      Alert.alert('Error', 'Please enter a category for your item');
      return;
    }

    setUploading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // fetch image as blob
      const response = await fetch(selected.uri);
      const blob = await response.blob();

      // upload to Firebase Storage
      const filename = `posts/${user.uid}/${Date.now()}_${selected.id}.jpg`;
      const imageRef = firebaseStorageRef(storage, filename);
      await uploadBytes(imageRef, blob);
      const downloadUrl = await getDownloadURL(imageRef);

      // store post in Firestore
      await addDoc(collection(db, 'items'), {
        title: title.toLowerCase(), // Store lowercase for case-insensitive search
        displayTitle: title, // Store original case for display
        description: description,
        category: category,
        imageUrl: downloadUrl,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Your item has been posted!');
      router.replace('/activity');
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert(
        'Upload Failed',
        'Something went wrong uploading your photo. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const renderItem = ({ item }: { item: Asset }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelected(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.image} />
      {selected?.id === item.id && <View style={styles.overlay} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (uploading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={{ marginTop: 8 }}>Uploading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container}>
        {/* Top Bar */}
        <LinearGradient
          colors={['#FDE6D6', '#EAE4F2']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.headerButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            onPress={handleUpload}
            disabled={!selected || !title.trim() || !category.trim()}
          >
            <Text
              style={[
                styles.headerButton,
                {
                  color:
                    selected && title.trim() && category.trim()
                      ? '#6C63FF'
                      : '#AAA',
                },
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Item Title"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />
          <TextInput
            style={styles.input}
            placeholder="Category (e.g., Shirts, Pants, Dresses)"
            value={category}
            onChangeText={setCategory}
            maxLength={30}
          />
        </View>

        {/* Photo Grid */}
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.photoItem}
              onPress={() => setSelected(item)}
            >
              <Image
                source={{ uri: item.uri }}
                style={styles.photo}
              />
              {selected?.id === item.id && (
                <View style={styles.selectedOverlay}>
                  <Text style={styles.selectedText}>Selected</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.grid}
        />

        {/* Permission Modal */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalBG}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                Allow UniFit to access your photos?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setModalVisible(false);
                    fetchAssets();
                  }}
                >
                  <Text style={styles.modalButtonText}>Allow Access</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Don't Allow</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  photoItem: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    margin: CARD_MARGIN,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  safe: { flex: 1, backgroundColor: '#FFF' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerButton: {
    fontSize: 16,
    color: '#6C63FF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  grid: {
    margin: CARD_MARGIN,
  },
  card: {
    margin: CARD_MARGIN,
    width: CARD_WIDTH,
    height: CARD_WIDTH,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(108,99,255,0.3)',
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBG: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#111827',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#6C63FF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  inputContainer: {
    padding: 16,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});