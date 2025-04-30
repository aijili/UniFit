// app/(tabs)/post.tsx
// app/(tabs)/post.tsx

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DropDownPicker from 'react-native-dropdown-picker';

import { auth, db, storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const CATEGORIES = [
  { label: 'Formal', value: 'formal' },
  { label: 'Casual', value: 'casual' },
  { label: 'Going Out', value: 'going out' },
  { label: 'Athleisure', value: 'athleisure' },
  { label: 'Loungewear', value: 'loungewear' },
  { label: 'Outerwear', value: 'outerwear' },
  { label: 'Vacation', value: 'vacation' },
  { label: 'Workwear', value: 'workwear' },
  { label: 'Costume', value: 'costume' },
];

const COLORS = [
  { label: 'Black', value: 'black' },
  { label: 'White', value: 'white' },
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Pink', value: 'pink' },
  { label: 'Purple', value: 'purple' },
  { label: 'Orange', value: 'orange' },
  { label: 'Brown', value: 'brown' },
  { label: 'Gray', value: 'gray' },
  { label: 'Other', value: 'other' },
];

const SIZES = [
  { label: 'XS', value: 'xs' },
  { label: 'S', value: 's' },
  { label: 'M', value: 'm' },
  { label: 'L', value: 'l' },
  { label: 'XL', value: 'xl' },
  { label: 'XXL', value: 'xxl' },
];

export default function PostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [availability, setAvailability] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);

  // Dropdown states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const validateUrl = (input: string) => {
    if (!input) return true;
    try { new URL(input); return true; }
    catch { return false; }
  };

  const canPost =
    !!imageUri &&
    !!category &&
    !!color &&
    !!size &&
    !!description &&
    !!price &&
    validateUrl(url) &&
    !uploading;

  const handlePost = async () => {
    if (!canPost) {
      Alert.alert('Missing fields', 'Please fill out all required fields.');
      return;
    }
    setUploading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user found');
      }

      // No image upload, just use the local URI
      const picture = imageUri;

      // Create post document
      const postId = `${user.uid}-${Date.now()}`;
      await setDoc(doc(db, 'posts', postId), {
        uid: user.uid,
        picture, // This is just the local URI
        category,
        color,
        size,
        description,
        price: parseFloat(price),
        url: url || null,
        availability,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Your item is now live.');
      router.back();
    } catch (error: any) {
      console.error('Error creating post:', error);
      Alert.alert('Error', `Failed to create post: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <LinearGradient colors={['#FDE6D6', '#FFFFFF']} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { paddingBottom: insets.bottom + 80 },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Create Post</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Photo Card */}
            <View style={styles.photoCard}>
              <TouchableOpacity
                style={styles.photoPicker}
                onPress={pickImage}
              >
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.photo}
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons
                      name="camera-outline"
                      size={48}
                      color="#AAA"
                    />
                    <Text style={styles.photoHint}>
                      Tap to add photo
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.label}>Category *</Text>
              <DropDownPicker
                open={categoryOpen}
                value={category}
                items={CATEGORIES}
                setOpen={setCategoryOpen}
                setValue={setCategory}
                placeholder="Select category"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                zIndex={3000}
                zIndexInverse={1000}
              />

              <Text style={styles.label}>Color *</Text>
              <DropDownPicker
                open={colorOpen}
                value={color}
                items={COLORS}
                setOpen={setColorOpen}
                setValue={setColor}
                placeholder="Select color"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                zIndex={2000}
                zIndexInverse={2000}
              />

              <Text style={styles.label}>Size *</Text>
              <DropDownPicker
                open={sizeOpen}
                value={size}
                items={SIZES}
                setOpen={setSizeOpen}
                setValue={setSize}
                placeholder="Select size"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                zIndex={1000}
                zIndexInverse={3000}
              />

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your item"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 10"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />

              <Text style={styles.label}>URL (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://"
                value={url}
                onChangeText={setUrl}
                keyboardType="url"
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Available</Text>
                <Switch
                  value={availability}
                  onValueChange={setAvailability}
                  trackColor={{ false: '#CCC', true: '#81b0ff' }}
                  thumbColor={availability ? '#6C63FF' : '#FFF'}
                />
              </View>
            </View>
          </ScrollView>

          {/* Sticky Footer */}
          <View
            style={[
              styles.footer,
              { bottom: insets.bottom + 16 },
            ]}
          >
            <TouchableOpacity
              onPress={handlePost}
              disabled={!canPost}
              style={[
                styles.postBtn,
                !canPost && styles.postBtnDisabled,
              ]}
            >
              {uploading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.postBtnText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  photoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE6D6',
  },
  photoPicker: {
    height: 200,
    borderRadius: 10,
    backgroundColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHint: {
    marginTop: 8,
    color: '#999',
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE6D6',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  dropdown: {
    backgroundColor: '#FAFAFA',
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  dropdownContainer: {
    backgroundColor: '#FAFAFA',
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 8,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  postBtn: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  postBtnDisabled: {
    backgroundColor: '#BBB',
  },
  postBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

