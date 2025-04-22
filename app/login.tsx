import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    // Check if Firebase is initialized
    const checkFirebase = async () => {
      try {
        setIsLoading(true);
        // Simple check if auth is available
        if (auth) {
          console.log("Firebase Auth initialized successfully");
          setFirebaseReady(true);
        } else {
          console.error("Firebase Auth not initialized");
        }
      } catch (error) {
        console.error("Firebase initialization error:", error);
        Alert.alert(
          "Firebase Error",
          "There was a problem connecting to our services. Please try again later."
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkFirebase();
  }, []);

  const handleLogin = async () => {
    if (!firebaseReady || !auth) {
      Alert.alert("Error", "Firebase is not ready. Please try again later.");
      return;
    }

    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Logged in!');
      router.replace('/'); // Navigate to home screen
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.message || "Unknown error occurred";
      Alert.alert('Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!firebaseReady || !auth) {
      Alert.alert("Error", "Firebase is not ready. Please try again later.");
      return;
    }

    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password should be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Account created!');
    } catch (error: any) {
      console.error("Sign up error:", error);
      const errorMessage = error.message || "Unknown error occurred";
      Alert.alert('Sign Up Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{marginTop: 10}}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      
      {!firebaseReady && (
        <Text style={styles.errorText}>
          Firebase connection issue. Please check your internet connection.
        </Text>
      )}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <Button title="Log In" onPress={handleLogin} disabled={!firebaseReady} />
      <View style={{ height: 10 }} />
      <Button title="Sign Up" onPress={handleSignUp} disabled={!firebaseReady} />
      
      <TouchableOpacity 
        style={styles.debugLink} 
        onPress={() => router.push('/firebase-debug')}
      >
        <Text style={styles.debugText}>Debug Firebase Connection</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  centered: {
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    alignSelf: 'center'
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 12,
    padding: 8,
    fontSize: 16
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15
  },
  debugLink: {
    marginTop: 30,
    alignItems: 'center'
  },
  debugText: {
    color: 'blue',
    textDecorationLine: 'underline'
  }
}); 