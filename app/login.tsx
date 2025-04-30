import React, { useState } from 'react';
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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getErrorMessage = (code: string) => {
    const errorMap: Record<string, string> = {
      'auth/user-not-found': 'Invalid email or password',
      'auth/wrong-password': 'Invalid email or password',
      'auth/invalid-email': 'Invalid email format',
      'auth/email-already-in-use': 'Email already in use',
      'auth/weak-password': 'Password must be at least 6 characters',
      'auth/network-request-failed': 'Network error. Check your connection',
      'auth/too-many-requests': 'Too many attempts. Try again later',
      default: 'An unexpected error occurred',
    };
    return errorMap[code] || errorMap.default;
  };

  const handleAuth = async (isLogin: boolean) => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in both email and password');
      return;
    }

    if (!isLogin && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          username: email.split('@')[0],
          avatarUrl: null,
          borrowedCount: 0,
          lentCount: 0,
          rating: 0,
          createdAt: new Date().toISOString(),
        });
      }
      router.replace('/(tabs)/home');
    } catch (error: any) {
      const message = getErrorMessage(error.code);
      Alert.alert(isLogin ? 'Login Failed' : 'Signup Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FDE6D6', '#FFFFFF']}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
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

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#6B7280"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.toggleText}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#6C63FF" />
        ) : (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleAuth(true)}
            >
              <Text style={styles.primaryButtonText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleAuth(false)}
            >
              <Text style={styles.secondaryButtonText}>
                Create New Account
              </Text>
            </TouchableOpacity>
          </>
        )}

        {__DEV__ && (
          <Text style={styles.debugText}>
            {auth.currentUser?.uid ? `Logged in as: ${auth.currentUser.email}` : 'Not logged in'}
          </Text>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
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
    padding: 16,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  toggleButton: {
    padding: 16,
  },
  toggleText: {
    color: '#6C63FF',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#6C63FF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  secondaryButtonText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugText: {
    marginTop: 20,
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default LoginScreen;
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   Image,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
// import { useRouter } from 'expo-router';
// import { auth, db } from '../firebaseConfig.js';
// import { doc, setDoc } from 'firebase/firestore';

// export default function LoginScreen() {
//   const router = useRouter();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [firebaseReady, setFirebaseReady] = useState(false);
//   const [debugInfo, setDebugInfo] = useState('');

//   useEffect(() => {
//     // Check if user is already logged in
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       console.log('Auth state changed:', user ? 'User logged in' : 'No user');
//       setDebugInfo(`Auth state: ${user ? 'Logged in' : 'Not logged in'}`);
      
//       if (user) {
//         // User is signed in, redirect to home
//         console.log('User is signed in, redirecting to tabs');
//         router.replace('/(tabs)' as any);
//       }
//       setFirebaseReady(true);
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleLogin = async () => {
//     if (!email || !password) {
//       Alert.alert('Error', 'Please enter both email and password.');
//       return;
//     }
//     setIsLoading(true);
//     try {
//       console.log('Attempting to sign in with:', email);
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       console.log('Sign in successful:', userCredential.user.uid);
//       setDebugInfo(`Sign in successful: ${userCredential.user.uid}`);
      
//       // Force navigation to tabs
//       // router.replace('/(tabs)' as any);
//       router.replace('/(tabs)/home');

//     } catch (err: any) {
//       console.error('Login error:', err);
//       setDebugInfo(`Login error: ${err.code}`);
      
//       let msg = 'An unexpected error occurred.';
//       if (
//         err.code === 'auth/user-not-found' ||
//         err.code === 'auth/wrong-password'
//       ) {
//         msg = 'Invalid email or password.';
//       } else if (err.code === 'auth/invalid-email') {
//         msg = 'Invalid email format.';
//       } else if (err.code === 'auth/operation-not-allowed') {
//         msg =
//           'Email/password sign-in is not enabled. Please contact support.';
//       }
//       Alert.alert('Login Failed', msg);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSignUp = async () => {
//     if (!email || !password) {
//       Alert.alert('Error', 'Please enter both email and password.');
//       return;
//     }
//     if (password.length < 6) {
//       Alert.alert('Error', 'Password must be at least 6 characters.');
//       return;
//     }
//     setIsLoading(true);
//     let authUser = null;
    
//     try {
//       console.log('Starting signup process...');
//       // Create auth user
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       authUser = userCredential.user;
//       console.log('Auth user created successfully:', authUser.uid);
//       setDebugInfo(`Auth user created: ${authUser.uid}`);
      
//       // Create user document in Firestore
//       const userDoc = {
//         email: email,
//         username: email.split('@')[0], // Default username from email
//         avatarUrl: null,
//         borrowedCount: 0,
//         lentCount: 0,
//         rating: 0,
//         createdAt: new Date().toISOString(),
//       };
      
//       try {
//         const userRef = doc(db, 'users', authUser.uid);
//         console.log('Attempting to create Firestore document at:', userRef.path);
//         await setDoc(userRef, userDoc);
//         console.log('User document created in Firestore successfully');
        
//         // Add a small delay to ensure Firestore operation is complete
//         await new Promise(resolve => setTimeout(resolve, 1000));
        
//         // Navigate to home screen
//         console.log('Navigating to home screen...');
//         router.replace('/(tabs)/home');
        
//       } catch (firestoreError: any) {
//         console.error('Detailed Firestore error:', {
//           code: firestoreError.code,
//           message: firestoreError.message,
//           details: firestoreError
//         });
        
//         if (authUser) {
//           console.log('Deleting auth user due to Firestore error...');
//           try {
//             await authUser.delete();
//             console.log('Auth user deleted successfully');
//           } catch (deleteError) {
//             console.error('Error deleting auth user:', deleteError);
//           }
//         }
        
//         throw new Error(`Failed to create user profile: ${firestoreError.message}`);
//       }
//     } catch (err: any) {
//       console.error('Signup process error:', err);
//       setDebugInfo(`Signup error: ${err.code || err.message}`);
      
//       let msg = 'An unexpected error occurred.';
//       if (err.code === 'auth/email-already-in-use') {
//         msg = 'Email is already in use.';
//       } else if (err.code === 'auth/invalid-email') {
//         msg = 'Invalid email format.';
//       } else if (err.code === 'auth/weak-password') {
//         msg = 'Password is too weak.';
//       } else if (err.code === 'auth/operation-not-allowed') {
//         msg = 'Email/password sign-up is not enabled. Please contact support.';
//       } else if (err.message) {
//         msg = err.message;
//       }
//       Alert.alert('Sign Up Failed', msg);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (isLoading || !firebaseReady) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#6C63FF" />
//         <Text style={styles.loadingText}>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <LinearGradient
//       colors={['#FDE6D6', '#FFFFFF']}
//       start={{ x: 0.5, y: 0 }}
//       end={{ x: 0.5, y: 1 }}
//       style={styles.gradient}
//     >
//       <KeyboardAvoidingView
//         behavior={Platform.select({ ios: 'padding', android: undefined })}
//         style={styles.container}
//       >
//         <Image
//           source={require('../assets/images/logo.png')}
//           style={styles.logo}
//           resizeMode="contain"
//         />

//         <TextInput
//           style={styles.input}
//           placeholder="Email"
//           placeholderTextColor="#6B7280"
//           autoCapitalize="none"
//           keyboardType="email-address"
//           value={email}
//           onChangeText={setEmail}
//         />
//         <TextInput
//           style={styles.input}
//           placeholder="Password"
//           placeholderTextColor="#6B7280"
//           secureTextEntry
//           value={password}
//           onChangeText={setPassword}
//         />

//         <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
//           <Text style={styles.primaryButtonText}>Log In</Text>
//         </TouchableOpacity>

//         <TouchableOpacity onPress={handleSignUp}>
//           <Text style={styles.signUpText}>Don't have an account? Sign Up</Text>
//         </TouchableOpacity>
        
//         {/* Debug info */}
//         <Text style={styles.debugText}>{debugInfo}</Text>
//       </KeyboardAvoidingView>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   gradient: { flex: 1 },
//   container: {
//     flex: 1,
//     paddingHorizontal: 32,
//     justifyContent: 'center',
//   },
//   logo: {
//     width: 120,
//     height: 120,
//     alignSelf: 'center',
//     marginBottom: 32,
//   },
//   input: {
//     backgroundColor: '#F3F4F6',
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#111827',
//     marginBottom: 16,
//   },
//   primaryButton: {
//     backgroundColor: '#6C63FF',
//     borderRadius: 8,
//     paddingVertical: 14,
//     alignItems: 'center',
//     marginTop: 8,
//   },
//   primaryButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   signUpText: {
//     color: '#6C63FF',
//     textAlign: 'center',
//     marginTop: 16,
//     fontSize: 14,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 12,
//     color: '#6C63FF',
//     fontSize: 16,
//   },
//   debugText: {
//     marginTop: 20,
//     color: '#666',
//     fontSize: 12,
//     textAlign: 'center',
//   },
// });