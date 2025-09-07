// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../services/api';
import socketService from '../services/socketService';

interface User {
  id: string;
  username: string;
  email: string;
  age: number;
  authProvider: 'local' | 'google';
  isVerified: boolean;
  parentEmail?: string;
  role: 'children' | 'user' | 'moderator' | 'admin';
  fullName?: string;
  emailVerified?: boolean;
  parentEmailVerified?: boolean;
  verificationStatus?: 'pending' | 'partial' | 'complete';
}

interface AuthContextType {
  user: User | null;
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  signup: (userData: {
    username: string;
    email: string;
    password: string;
    age: number;
    parentEmail?: string;
  }) => Promise<{
    requiresVerification: boolean;
    requiresParentVerification: boolean;
    verificationResults?: any;
  }>;
  googleLogin: (idToken: string) => Promise<void>;
  completeGoogleRegistration: (userData: {
    username: string;
    age: number;
    parentEmail?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (userData: { username?: string; fullName?: string }) => Promise<void>;
  getUserId: () => Promise<string | null>;
  setUserIdLocal: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthData = async () => {
    console.log('Clearing authentication data...');
    
    try {
      // Disconnect socket first
      socketService.disconnect();
      console.log('Socket disconnected');
      
      // Clear AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem('authToken'),
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('userId')
      ]);
      console.log('AsyncStorage cleared');
      
      // Clear state
      setUser(null);
      setUserId(null);
      
      console.log('Auth data cleared successfully');
    } catch (error) {
      console.error('Error clearing auth data:', error);
      // Still try to clear state even if AsyncStorage fails
      setUser(null);
      setUserId(null);
      socketService.disconnect();
    }
  };

  const getUserId = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('userId');
    } catch (error) {
      console.log('Error getting user ID:', error);
      return null;
    }
  };

  const setUserIdLocal = async (userIdToStore: string): Promise<void> => {
    try {
      await AsyncStorage.setItem('userId', userIdToStore);
      setUserId(userIdToStore);
    } catch (error) {
      console.log('Error storing user ID:', error);
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getProfile();
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      await AsyncStorage.setItem('userId', response.data.user.id);
      setUser(response.data.user);
      setUserId(response.data.user.id);
    } catch (error) {
      console.log('User refresh error:', error);
      await clearAuthData();
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('user');
      const storedUserId = await AsyncStorage.getItem('userId');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setUserId(storedUserId || parsedUser.id);
        
        // If userId is not stored separately, store it
        if (!storedUserId && parsedUser.id) {
          await AsyncStorage.setItem('userId', parsedUser.id);
        }
        
        // Verify token is still valid by fetching profile
        try {
          await refreshUser();
        } catch {
          // If refresh fails, clear auth data
          await clearAuthData();
        }
      }
    } catch (error) {
      console.log('Auth check error:', error);
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  // Check if user is authenticated on app start
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Connect to socket when user is authenticated
  useEffect(() => {
    if (user) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }
  }, [user]);

  const login = async (emailOrUsername: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Starting login process...');
      console.log('Email/Username:', emailOrUsername);
      
      const response = await authApi.login({ emailOrUsername, password });
      console.log('Login response received:', JSON.stringify(response, null, 2));
      
      if (!response.token) {
        console.error('No token in response');
        throw new Error('No token received from server');
      }
      
      if (!response.data || !response.data.user) {
        console.error(' No user data in response');
        throw new Error('No user data received from server');
      }
      
      console.log('User data received:', JSON.stringify(response.data.user, null, 2));
      
      console.log('Storing auth data...');
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      await AsyncStorage.setItem('userId', response.data.user.id);
      
      console.log('Setting user state...');
      setUser(response.data.user);
      setUserId(response.data.user.id);
      
      console.log('Login successful!');
    } catch (error: any) {
      console.error('Login error details:');
      console.error('  - Error type:', typeof error);
      console.error('  - Error message:', error.message);
      console.error('  - Has response?', !!error.response);
      
      if (error.response) {
        console.error('  - Response status:', error.response.status);
        console.error('  - Response data:', error.response.data);
        console.error('  - Response headers:', error.response.headers);
      }
      
      if (error.request) {
        console.error('  - Request made but no response received');
        console.error('  - Request details:', error.request);
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: {
    username: string;
    email: string;
    password: string;
    age: number;
    parentEmail?: string;
  }) => {
    try {
      setIsLoading(true);
      const response = await authApi.signup(userData);
      
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      await AsyncStorage.setItem('userId', response.data.user.id);
      setUser(response.data.user);
      setUserId(response.data.user.id);
      
      // Return verification info for the frontend to handle
      return {
        requiresVerification: response.requiresVerification || false,
        requiresParentVerification: response.requiresParentVerification || false,
        verificationResults: response.verificationResults
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (idToken: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.googleAuth(idToken);
      
      if (response.requiresRegistration) {
        // User needs to complete registration
        return response;
      }
      
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      await AsyncStorage.setItem('userId', response.data.user.id);
      setUser(response.data.user);
      setUserId(response.data.user.id);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const completeGoogleRegistration = async (userData: {
    username: string;
    age: number;
    parentEmail?: string;
  }) => {
    try {
      setIsLoading(true);
      const response = await authApi.completeGoogleRegistration(userData);
      
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      await AsyncStorage.setItem('userId', response.data.user.id);
      setUser(response.data.user);
      setUserId(response.data.user.id);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration completion failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Starting logout process...');
      setIsLoading(true);
      
      // Call backend logout endpoint
      try {
        await authApi.logout();
        console.log('Backend logout successful');
      } catch (backendError) {
        console.log('Backend logout error:', backendError);
        // Continue with local logout even if backend fails
      }
    } catch (error) {
      console.error('Logout process error:', error);
    } finally {
      // Always clear local data
      console.log('Clearing local auth data...');
      await clearAuthData();
      setIsLoading(false);
      console.log('Logout complete');
    }
  };

  const updateProfile = async (userData: { username?: string; fullName?: string }) => {
    try {
      const response = await authApi.updateProfile(userData);
      
      // Update local storage with new user data
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      
      // Refresh user data to ensure consistency
      await refreshUser();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  };

  const value: AuthContextType = {
    user,
    userId,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    googleLogin,
    completeGoogleRegistration,
    logout,
    refreshUser,
    updateProfile,
    getUserId,
    setUserIdLocal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
