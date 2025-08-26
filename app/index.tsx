import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Check if user needs verification
        if (user?.verificationStatus !== 'complete' && !user?.isVerified) {
          router.replace('/verification');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        router.replace('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading, user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chuti</Text>
      <Text style={styles.subtitle}>Child Safe Chat App</Text>
      <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 40,
    textAlign: 'center',
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
