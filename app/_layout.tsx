import { Stack, SplashScreen } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator, Text } from 'react-native';
import { useEffect } from 'react';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Hide splash screen when we're done loading
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  // Render loading indicator
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={{ marginTop: 10 }}>Loading app...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        // Authenticated routes
        <Stack.Screen name="(tabs)" />
      ) : (
        // Unauthenticated routes
        <Stack.Screen name="login" />
      )}
    </Stack>
  );
}