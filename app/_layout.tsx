import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  useFrameworkReady();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{}} />
        <Stack.Screen name="chat/[id]" options={{}} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
