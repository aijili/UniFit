import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DropDownPicker from 'react-native-dropdown-picker';

import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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

export default function EditListingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [availability, setAvailability] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Dropdown states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        console.log('Fetching listing with ID:', id); // Debug log
        
        const listingRef = doc(db, 'posts', id as string);
        const listingSnap = await getDoc(listingRef);
        
        if (listingSnap.exists()) {
          const data = listingSnap.data();
          console.log('Fetched listing data:', data);
          
          setImageUri(data.picture || null);
          setCategory(data.category || null);
          setColor(data.color || null);
          setSize(data.size || null);
          setDescription(data.description || '');
          setPrice(data.price?.toString() || '');
          setUrl(data.url || '');
          setAvailability(data.availability ?? true);
        } else {
          console.error('Listing not found in posts collection');
          Alert.alert('Error', 'Listing not found');
          router.back();
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
        Alert.alert('Error', 'Failed to load listing');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

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

  const canSave =
    !!imageUri &&
    !!category &&
    !!color &&
    !!size &&
    !!description &&
    !!price &&
    validateUrl(url) &&
    !saving;

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert('Missing fields', 'Please fill out all required fields.');
      return;
    }
    setSaving(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user found');
      }

      await setDoc(doc(db, 'posts', id as string), {
        picture: imageUri,
        category,
        color,
        size,
        description,
        price: parseFloat(price),
        url: url || null,
        availability,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      Alert.alert('Success', 'Your listing has been updated.');
      router.back();
    } catch (error: any) {
      console.error('Error updating listing:', error);
      Alert.alert('Error', `Failed to update listing: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

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
              <Text style={styles.headerTitle}>Edit Listing</Text>
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
                      Tap to change photo
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
              onPress={handleSave}
              disabled={!canSave}
              style={[
                styles.saveBtn,
                !canSave && styles.saveBtnDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
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
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    borderRadius: 10,
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
  saveBtn: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#BBB',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 