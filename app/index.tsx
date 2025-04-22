import { Text, View, Button } from "react-native";
import { router } from "expo-router";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ marginBottom: 20 }}>Welcome to UniFit</Text>
      <Button 
        title="Go to Login" 
        onPress={() => router.push("/login")} 
      />
    </View>
  );
}
