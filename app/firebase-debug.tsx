import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import { router } from 'expo-router';
import { auth } from '../firebaseConfig';
import { testFirebaseConnectivity } from '../networkTest.js';

// Define the type for network test result
interface NetworkTestResult {
  success: boolean;
  error?: string;
  auth?: {
    reachable: boolean;
    statusCode: number;
    response: any;
  };
  firestore?: {
    reachable: boolean;
    statusCode: number;
  };
}

export default function FirebaseDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const checkFirebaseConfig = () => {
    try {
      setIsLoading(true);
      addLog('Starting Firebase diagnostics...');
      
      // Check if Firebase apps are initialized
      const apps = getApps();
      addLog(`Firebase apps initialized: ${apps.length}`);
      
      // Check auth
      if (auth) {
        addLog(`Auth initialized: true`);
        addLog(`Current user: ${auth.currentUser ? auth.currentUser.uid : 'No user'}`);
      } else {
        addLog('ERROR: Auth is not initialized properly');
      }
    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAnonymousSignIn = async () => {
    try {
      setIsLoading(true);
      addLog('Testing anonymous sign in...');
      
      if (!auth) {
        addLog('ERROR: Auth is not initialized');
        return;
      }
      
      const userCredential = await signInAnonymously(auth);
      addLog(`Anonymous sign in successful! UID: ${userCredential.user.uid}`);
    } catch (error: any) {
      addLog(`ERROR with anonymous sign in: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testNetworkConnectivity = async () => {
    try {
      setIsLoading(true);
      addLog('Testing network connectivity to Firebase...');
      
      const result = await testFirebaseConnectivity() as NetworkTestResult;
      
      if (result.success) {
        addLog('Network connectivity test successful!');
        if (result.auth) {
          addLog(`Auth endpoint: Status ${result.auth.statusCode}`);
        }
        if (result.firestore) {
          addLog(`Firestore endpoint: Status ${result.firestore.statusCode}`);
        }
      } else {
        addLog(`Network connectivity test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      addLog(`ERROR with network test: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Debug</Text>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Check Config" 
          onPress={checkFirebaseConfig}
          disabled={isLoading}
        />
        <View style={{ width: 10 }} />
        <Button 
          title="Test Auth" 
          onPress={testAnonymousSignIn}
          disabled={isLoading}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Test Network" 
          onPress={testNetworkConnectivity}
          disabled={isLoading}
        />
        <View style={{ width: 10 }} />
        <Button 
          title="Back to Login" 
          onPress={() => router.push('/login')}
          disabled={isLoading}
        />
      </View>

      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
        {logs.length === 0 && (
          <Text style={styles.placeholderText}>Press buttons above to run diagnostics</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  logText: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 5,
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  }
}); 