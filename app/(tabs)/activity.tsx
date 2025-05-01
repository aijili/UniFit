import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ListRenderItem,
} from 'react-native';
import { auth, db } from '../../firebaseConfig.js';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

interface BorrowRequest {
  id: string;
  itemId: string;
  ownerId: string;
  borrowerId: string;
  status: string;
  days: number;
  createdAt: string;
  dueDate?: string;
  item?: any;
  borrower?: any;
}

export default function ActivityScreen() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'borrowRequests'),
          where('ownerId', '==', user.uid),
          where('status', '==', 'pending')
        );
        const snap = await getDocs(q);

        const reqs = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            // Fetch item info
            let item = null;
            try {
              const itemDoc = await getDoc(doc(db, 'posts', data.itemId));
              if (itemDoc.exists()) item = itemDoc.data();
            } catch (e) {
              console.warn('Failed to fetch item data:', e);
            }
            // Fetch borrower info
            let borrower = null;
            try {
              const borrowerDoc = await getDoc(doc(db, 'users', data.borrowerId));
              if (borrowerDoc.exists()) borrower = borrowerDoc.data();
            } catch (e) {
              console.warn('Failed to fetch borrower data:', e);
            }
            return {
              id: d.id,
              ...data,
              item,
              borrower,
            } as BorrowRequest;
          })
        );

        setRequests(reqs);
      } catch (err: any) {
        console.error('Error fetching requests:', err);
        Alert.alert('Error', err.message || 'Failed to load requests.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleResponse = async (
    id: string,
    response: 'accepted' | 'declined',
    days?: number,
    borrowerId?: string,
    ownerId?: string
  ) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to perform this action.');
        return;
      }

      console.log('Current user:', user.uid);
      console.log('Request ID:', id);
      console.log('Response:', response);
      console.log('Days:', days);
      console.log('Borrower ID:', borrowerId);
      console.log('Owner ID:', ownerId);

      // Get the request document first to verify ownership
      const requestRef = doc(db, 'borrowRequests', id);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        Alert.alert('Error', 'Request not found.');
        return;
      }

      const requestData = requestSnap.data();
      console.log('Request data:', requestData);

      if (requestData.ownerId !== user.uid) {
        Alert.alert('Error', 'You do not have permission to update this request.');
        return;
      }

      let update: any = { status: response };
      if (response === 'accepted' && days) {
        // Set dueDate to now + days
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);
        update.dueDate = dueDate.toISOString();
      }

      console.log('Update data:', update);
      await updateDoc(requestRef, update);

      // If accepted, increment owner's lent count
      if (response === 'accepted' && ownerId) {
        await runTransaction(db, async (transaction) => {
          const ownerRef = doc(db, 'users', ownerId);
          const ownerSnap = await transaction.get(ownerRef);
          const ownerCount = (ownerSnap.data()?.lentCount || 0) + 1;
          transaction.update(ownerRef, { lentCount: ownerCount });
        });
      }

      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error('Borrow request update error:', err);
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      Alert.alert('Error', err.message || 'Failed to update request.');
    }
  };

  const renderItem: ListRenderItem<BorrowRequest> = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={
          item.borrower?.avatarUrl
            ? { uri: item.borrower.avatarUrl }
            : require('../../assets/images/icon.png')
        }
        style={styles.avatar}
      />
      <View style={styles.textContainer}>
        <Text style={styles.message}>
          {item.borrower?.username || 'Someone'} wants to borrow your{' '}
          {item.item?.description || 'item'} for {item.days} days.
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.accept]}
            onPress={() => handleResponse(item.id, 'accepted', item.days, item.borrowerId, item.ownerId)}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.decline]}
            onPress={() => handleResponse(item.id, 'declined')}
          >
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No borrow requests yet.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 20, fontWeight: '600', color: '#111827' },
  list: { padding: 16 },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#6B7280',
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  textContainer: { flex: 1 },
  message: { fontSize: 16, color: '#111827', marginBottom: 8 },
  buttonRow: { flexDirection: 'row' },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  accept: { backgroundColor: '#6C63FF' },
  decline: { backgroundColor: '#FF6B6B' },
  buttonText: { color: '#FFFFFF', fontWeight: '500' },
});
