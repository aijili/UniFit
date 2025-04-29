import React from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { View, ActivityIndicator, Text } from "react-native";

// This hook will protect the route access based on user authentication
function useProtectedRoute(user: User | null) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === "(tabs)";
    
    if (!user && inAuthGroup) {
      // Redirect to login if user is not signed in and trying to access protected routes
      router.replace("/login");
    } else if (user && segments[0] === "login") {
      // Redirect to home if user is signed in and trying to access auth routes
      router.replace("/");
    }
  }, [user, segments]);
}

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useProtectedRoute(user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" }}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={{ marginTop: 10, color: "#333", fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" }}>
        <Text style={{ color: "red", fontSize: 16, textAlign: "center", padding: 20 }}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: "slide_from_right",
      contentStyle: { backgroundColor: "#f5f5f5" }
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
