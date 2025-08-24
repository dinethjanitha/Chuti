import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('🔐 AuthGuard: Auth state changed', { isLoading, isAuthenticated });
    
    if (!isLoading && !isAuthenticated) {
      console.log('🚪 AuthGuard: User not authenticated, redirecting to login...');
      // Use replace to avoid navigation stack issues
      router.replace('../auth/login');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    console.log('⏳ AuthGuard: Still loading...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ AuthGuard: Not authenticated, showing null while redirecting...');
    return null; // Will redirect to login
  }

  console.log('✅ AuthGuard: Authenticated, showing children');
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
});
