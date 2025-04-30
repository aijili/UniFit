import React from 'react';
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
  Pressable,
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
    imageUrl?: string;
    description: string;
    color: string;
    url?: string;
  } | null;
}

const { width } = Dimensions.get('window');

export default function ListingModal({ visible, onClose, item }: ListingModalProps) {
  console.log('Modal props:', { visible, item });

  if (!item) {
    console.log('No item provided to modal');
    return null;
  }

  console.log('Rendering modal with item:', item);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>

          <ScrollView style={styles.scrollView}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.image}
                resizeMode="cover"
                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
              />
            ) : (
              <View style={[styles.image, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={40} color="#9CA3AF" />
              </View>
            )}

            <View style={styles.contentContainer}>
              <Text style={styles.title}>{item.title}</Text>
              
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>{item.category}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Size:</Text>
                  <Text style={styles.detailValue}>{item.size}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Color:</Text>
                  <Text style={styles.detailValue}>{item.color}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Price:</Text>
                  <Text style={styles.price}>${item.price}</Text>
                </View>
              </View>

              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Description</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>

              <View style={styles.availabilityContainer}>
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

              {item.url && (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => Linking.openURL(item.url || '')}
                >
                  <Text style={styles.linkButtonText}>View Original Listing</Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 300,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  detailsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  price: {
    fontSize: 18,
    color: '#6C63FF',
    fontWeight: '700',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  availabilityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  availabilityText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  linkButton: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 