import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Linking,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ListingModalProps {
  visible: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    category: string;
    size: string;
    price: number;
    availability: boolean;
    picture?: string;
    description: string;
    color: string;
    url?: string | null;
    uid: string;
    createdAt?: any;
    updatedAt?: any;
  } | null;
  onSave?: (updatedItem: any) => void;
  isOwner?: boolean;
}

const { width, height } = Dimensions.get('window');

export default function ListingModal({ visible, onClose, item, onSave, isOwner = false }: ListingModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(item);

  useEffect(() => {
    setEditedItem(item);
    setIsEditing(false);
  }, [item]);

  if (!item) return null;

  const handleSave = () => {
    if (onSave && editedItem) onSave(editedItem);
    setIsEditing(false);
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setEditedItem(prev => prev ? { ...prev, [field]: value } : null);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleString();
    return new Date(date).toLocaleString();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header with close and edit icons */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
              <Ionicons name="close" size={26} color="#6B7280" />
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity style={styles.iconBtn} onPress={() => setIsEditing(e => !e)}>
                <Ionicons name={isEditing ? 'close' : 'create-outline'} size={26} color="#6C63FF" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Image */}
            {item.picture ? (
              <Image source={{ uri: item.picture }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <Ionicons name="image-outline" size={48} color="#9CA3AF" />
              </View>
            )}

            <View style={styles.content}>
              {/* Title */}
              {isEditing ? (
                <TextInput
                  style={styles.titleInput}
                  value={editedItem?.title}
                  onChangeText={text => handleChange('title', text)}
                  placeholder="Title"
                />
              ) : (
                <Text style={styles.title}>{item.title}</Text>
              )}

              {/* Category, Size, Color, Price */}
              <View style={styles.rowWrap}>
                <View style={styles.infoBlock}>
                  <Text style={styles.label}>Category</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={editedItem?.category}
                      onChangeText={text => handleChange('category', text)}
                      placeholder="Category"
                    />
                  ) : (
                    <Text style={styles.value}>{item.category}</Text>
                  )}
                </View>
                <View style={styles.infoBlock}>
                  <Text style={styles.label}>Size</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={editedItem?.size}
                      onChangeText={text => handleChange('size', text)}
                      placeholder="Size"
                    />
                  ) : (
                    <Text style={styles.value}>{item.size}</Text>
                  )}
                </View>
                <View style={styles.infoBlock}>
                  <Text style={styles.label}>Color</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={editedItem?.color}
                      onChangeText={text => handleChange('color', text)}
                      placeholder="Color"
                    />
                  ) : (
                    <Text style={styles.value}>{item.color}</Text>
                  )}
                </View>
              </View>
              <View style={styles.rowWrap}>
                <View style={styles.infoBlock}>
                  <Text style={styles.label}>Price</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={editedItem?.price?.toString()}
                      onChangeText={text => handleChange('price', parseFloat(text) || 0)}
                      placeholder="Price"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={[styles.value, styles.price]}>${item.price}</Text>
                  )}
                </View>
                <View style={styles.infoBlock}>
                  <Text style={styles.label}>Availability</Text>
                  {isEditing ? (
                    <TouchableOpacity
                      style={[styles.availBtn, { backgroundColor: editedItem?.availability ? '#10B981' : '#EF4444' }]}
                      onPress={() => handleChange('availability', !editedItem?.availability)}
                    >
                      <Text style={styles.availBtnText}>{editedItem?.availability ? 'Available' : 'Unavailable'}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.value, { color: item.availability ? '#10B981' : '#EF4444' }]}>
                      {item.availability ? 'Available' : 'Unavailable'}
                    </Text>
                  )}
                </View>
              </View>

              {/* Description */}
              <View style={{ marginBottom: 18 }}>
                <Text style={styles.label}>Description</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                    value={editedItem?.description}
                    onChangeText={text => handleChange('description', text)}
                    placeholder="Description"
                    multiline
                  />
                ) : (
                  <Text style={styles.value}>{item.description}</Text>
                )}
              </View>

              {/* URL */}
              {item.url && !isEditing && (
                <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(item.url!)}>
                  <Text style={styles.linkBtnText}>View Original Listing</Text>
                </TouchableOpacity>
              )}

              {/* Created/Updated At */}
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Created:</Text>
                <Text style={styles.metaValue}>{formatDate(item.createdAt)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Updated:</Text>
                <Text style={styles.metaValue}>{formatDate(item.updatedAt)}</Text>
              </View>

              {/* Save button in edit mode */}
              {isEditing && (
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: width * 0.92,
    maxHeight: height * 0.88,
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    zIndex: 2,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  image: {
    width: '100%',
    height: 240,
    backgroundColor: '#EEE',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingBottom: 4,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  infoBlock: {
    flex: 1,
    minWidth: 90,
    marginRight: 10,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  price: {
    color: '#6C63FF',
    fontWeight: '700',
  },
  availBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 2,
  },
  availBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 8,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
    marginBottom: 2,
  },
  linkBtn: {
    backgroundColor: '#6C63FF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 18,
  },
  linkBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  metaLabel: {
    color: '#6B7280',
    fontSize: 13,
  },
  metaValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#6C63FF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
}); 