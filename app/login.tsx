import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig.js';
import { doc, setDoc } from 'firebase/firestore';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      setDebugInfo(`Auth state: ${user ? 'Logged in' : 'Not logged in'}`);
      
      if (user) {
        // User is signed in, redirect to home
        console.log('User is signed in, redirecting to tabs');
        router.replace('/(tabs)' as any);
      }
      setFirebaseReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    try {
      console.log('Attempting to sign in with:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', userCredential.user.uid);
      setDebugInfo(`Sign in successful: ${userCredential.user.uid}`);
      
      // Force navigation to tabs
      // router.replace('/(tabs)' as any);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error('Login error:', err);
      setDebugInfo(`Login error: ${err.code}`);
      
      let msg = 'An unexpected error occurred.';
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email format.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg =
          'Email/password sign-in is not enabled. Please contact support.';
      }
      Alert.alert('Login Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    try {
      console.log('Attempting to create user with:', email);
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created successfully:', userCredential.user.uid);
      setDebugInfo(`User created: ${userCredential.user.uid}`);
      
      // Create user document in Firestore
      const userDoc = {
        email: email,
        username: email.split('@')[0], // Default username from email
        avatarUrl: null,
        borrowedCount: 0,
        lentCount: 0,
        rating: 0,
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
      console.log('User document created in Firestore');
      
      // Force navigation to tabs
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      console.error('Sign up error:', err);
      setDebugInfo(`Sign up error: ${err.code}`);
      
      let msg = 'An unexpected error occurred.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Email is already in use.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email format.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg =
          'Email/password sign-up is not enabled. Please contact support.';
      }
      Alert.alert('Sign Up Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !firebaseReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FDE6D6', '#FFFFFF']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.container}
      >
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6B7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSignUp}>
          <Text style={styles.signUpText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
        
        {/* Debug info */}
        <Text style={styles.debugText}>{debugInfo}</Text>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  signUpText: {
    color: '#6C63FF',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6C63FF',
    fontSize: 16,
  },
  debugText: {
    marginTop: 20,
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
});