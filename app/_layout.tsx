import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppStateProvider } from "@/contexts/AppStateContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useEffect } from "react";
import notificationService from "@/services/notificationService";

export default function RootLayout() {
  useFrameworkReady();

  // Setup notifications on app start
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        console.log('🔔 Setting up notifications...');
        await notificationService.setupNotifications();
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    // Setup notifications after a short delay to ensure app is ready
    const timer = setTimeout(setupNotifications, 1000);

    return () => {
      clearTimeout(timer);
      // Cleanup notification listeners when app unmounts
      notificationService.cleanup();
    };
  }, []);

  return (
    <ErrorBoundary>
      <AppStateProvider>
        <AuthProvider>
          <SafeAreaView style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{}} />
              <Stack.Screen name="newchat" options={{}} />
              <Stack.Screen name="chat/[id]" options={{}} />
              <Stack.Screen name="auth/login" options={{}} />
              <Stack.Screen name="auth/signup" options={{}} />
              <Stack.Screen name="verification" options={{}} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </SafeAreaView>
        </AuthProvider>
      </AppStateProvider>
    </ErrorBoundary>
  );
}
