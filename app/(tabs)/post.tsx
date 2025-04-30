// app/(tabs)/post.tsx
import React, { useState } from 'react';
import {
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db, storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function PostScreen() {
  const router = useRouter();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [type, setType] = useState<string>('');
  const [occasion, setOccasion] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo access to continue.');
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

  const handlePost = async () => {
    if (!imageUri || !type || !occasion || !color) {
      Alert.alert('Missing fields', 'Fill out image, type, occasion & color.');
      return;
    }

    setUploading(true);
    try {
      const user = auth.currentUser!;
      const blob = await (await fetch(imageUri)).blob();
      const path = `posts/${user.uid}/${Date.now()}.jpg`;
      const imgRef = ref(storage, path);
      await uploadBytes(imgRef, blob);
      const imageUrl = await getDownloadURL(imgRef);

      const postId = `${user.uid}-${Date.now()}`;
      await setDoc(doc(db, 'posts', postId), {
        userId: user.uid,
        imageUrl,
        type,
        occasion,
        color,
        price: price || null,
        link: link || null,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success!', 'Your item is now live.');
      router.back();
    } catch {
      Alert.alert('Error', 'Could not upload. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const canPost = !!imageUri && !!type && !!occasion && !!color && !uploading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            onPress={handlePost}
            disabled={!canPost}
            style={[
              styles.postBtn,
              !canPost && styles.postBtnDisabled,
            ]}
          >
            {uploading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.postBtnText}>Post</Text>}
          </TouchableOpacity>
        </View>

        {/* Image Picker Card */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {imageUri
              ? <Image source={{ uri: imageUri }} style={styles.selectedImage} />
              : (
                <View style={styles.placeholder}>
                  <Ionicons name="camera-outline" size={48} color="#aaa" />
                  <Text style={styles.placeholderText}>Tap to add photo</Text>
                </View>
              )}
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={type}
              onValueChange={setType}
              style={styles.picker}
            >
              <Picker.Item label="Select type" value="" />
              <Picker.Item label="Top" value="top" />
              <Picker.Item label="Bottom" value="bottom" />
              <Picker.Item label="Dress" value="dress" />
              <Picker.Item label="Shoes" value="shoes" />
              <Picker.Item label="Accessory" value="accessory" />
            </Picker>
          </View>

          <Text style={styles.label}>Occasion</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={occasion}
              onValueChange={setOccasion}
              style={styles.picker}
            >
              <Picker.Item label="Select occasion" value="" />
              <Picker.Item label="Casual" value="casual" />
              <Picker.Item label="Formal" value="formal" />
              <Picker.Item label="Party" value="party" />
              <Picker.Item label="Work" value="work" />
              <Picker.Item label="Sports" value="sports" />
            </Picker>
          </View>

          <Text style={styles.label}>Color</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={color}
              onValueChange={setColor}
              style={styles.picker}
            >
              <Picker.Item label="Select color" value="" />
              <Picker.Item label="Black" value="black" />
              <Picker.Item label="White" value="white" />
              <Picker.Item label="Red" value="red" />
              <Picker.Item label="Blue" value="blue" />
              <Picker.Item label="Green" value="green" />
              <Picker.Item label="Pink" value="pink" />
            </Picker>
          </View>

          <Text style={styles.label}>Price (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 25"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Link (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="External link"
            value={link}
            onChangeText={setLink}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F5F5F5',
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
    color: '#333',
  },
  postBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  postBtnDisabled: {
    backgroundColor: '#BBB',
  },
  postBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  imagePicker: {
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#ECECEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#444',
  },
  pickerWrapper: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
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
});