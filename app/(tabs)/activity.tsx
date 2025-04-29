// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';

// export default function ActivityScreen() {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Activity</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//   },
// }); 
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
} from 'react-native';
import { auth, db } from '../../firebaseConfig.js';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';

export default function ActivityScreen() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'notifications'),
          where('recipientId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setNotifications(docs);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        Alert.alert(
          'Error',
          'Failed to load notifications. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleResponse = async (id, response) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { status: response });
      setNotifications((prev) =>
        prev.filter((n) => n.id !== id)
      );
    } catch (err) {
      console.error('Error updating notification:', err);
      Alert.alert(
        'Error',
        'Failed to update notification. Please try again.'
      );
    }
  };

  const renderItem = ({ item }) => {
    const isRequest = item.type === 'borrow_request';
    const message = isRequest
      ? `${item.senderName} wants to borrow your ${item.itemName}`
      : `Your return of ${item.senderName}'s ${item.itemName} is due tomorrow`;

    return (
      <View style={styles.card}>
        <Image
          source={
            item.senderAvatarUrl
              ? { uri: item.senderAvatarUrl }
              : require('../../assets/images/icon.png')
          }
          style={styles.avatar}
          defaultSource={require('../../assets/images/icon.png')}
        />
        <View style={styles.textContainer}>
          <Text style={styles.message}>{message}</Text>
          {isRequest && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.accept]}
                onPress={() => handleResponse(item.id, 'accepted')}
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
          )}
        </View>
      </View>
    );
  };

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
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No activity yet.</Text>
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