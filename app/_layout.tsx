import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{}} />
          <Stack.Screen name="newchat" options={{}} />
          <Stack.Screen name="chat/[id]" options={{}} />
          <Stack.Screen name="auth/login" options={{}} />
          <Stack.Screen name="auth/signup" options={{}} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaView>
    </AuthProvider>
  );
}
