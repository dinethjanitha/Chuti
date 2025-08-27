// services/api.ts
import axios, { AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Log API URL for debugging
console.log('🌐 API_URL configured as:', API_URL);

if (!API_URL) {
  console.error('EXPO_PUBLIC_API_URL is not defined!');
}

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    });
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Auth token added to request');
      } else {
        console.log('No auth token found');
      }
    } catch (error) {
      console.log('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      dataKeys: response.data ? Object.keys(response.data) : 'No data',
    });
    return response;
  },
  async (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('🔄 Token expired, clearing auth data...');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      // You can redirect to login screen here
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authApi = {
  // Local authentication
  signup: async (userData: {
    username: string;
    email: string;
    password: string;
    age: number;
    parentEmail?: string;
  }) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  login: async (credentials: { emailOrUsername: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Google OAuth
  googleAuth: async (idToken: string) => {
    const response = await api.post('/auth/google', { idToken });
    return response.data;
  },

  completeGoogleRegistration: async (userData: {
    username: string;
    age: number;
    parentEmail?: string;
  }) => {
    const response = await api.post('/auth/google/complete', userData);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData: { username?: string; fullName?: string; profilePicture?: string }) => {
    const response = await api.patch('/auth/updateMe', userData);
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// Verification API calls
export const verificationApi = {
  // Send verification codes
  sendVerificationCodes: async (userId: string) => {
    const response = await api.post('/verification/send-codes', { userId });
    return response.data;
  },

  // Verify email with code
  verifyEmail: async (userId: string, email: string, code: string, type: 'user_email' | 'parent_email') => {
    const response = await api.post('/verification/verify-email', {
      userId,
      email,
      code,
      type
    });
    return response.data;
  },

  // Resend verification code
  resendVerificationCode: async (userId: string, email: string, type: 'user_email' | 'parent_email') => {
    const response = await api.post('/verification/resend-code', {
      userId,
      email,
      type
    });
    return response.data;
  },

  // Get verification status
  getVerificationStatus: async (userId: string) => {
    const response = await api.get(`/verification/status/${userId}`);
    return response.data;
  },
};

// Chat API calls
export const chatApi = {
  // Get user's chats
  getUserChats: async () => {
    const response = await api.get('/chat/');
    return response.data;
  },

  // Get chat messages
  getChatMessages: async (chatId: string, page: number = 1, limit: number = 50) => {
    const response = await api.get(`/messages/chat/${chatId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get chat details
  getChatDetails: async (chatId: string) => {
    const response = await api.get(`/chat/${chatId}`);
    return response.data;
  },

  // Create new chat/group
  createChat: async (chatData: {
    name?: string;
    type: 'direct' | 'group';
    participants?: string[];
    participantId?: string;
    description?: string;
  }) => {
    const response = await api.post('/chat', chatData);
    return response.data;
  },

  // Send message
  sendMessage: async (chatId: string, content: string, type: string = 'text') => {
    const response = await api.post('/messages', {
      chatId,
      content,
      type,
    });
    return response.data;
  },

  // Search users
  searchUsers: async (query: string) => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  // Delete chat
  deleteChat: async (chatId: string) => {
    const response = await api.delete(`/chat/${chatId}`);
    return response.data;
  },

  // Upload image
  uploadImage: async (chatId: string, imageUri: string, fileName: string) => {
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: fileName,
    } as any);

    const response = await api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds for image upload
    });
    return response.data;
  },
};

export default api;
