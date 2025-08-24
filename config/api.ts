import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Your backend server URL - update this with your actual backend URL
const API_BASE_URL = __DEV__ ? 'http://192.168.8.137:5000/api' : 'https://your-production-backend.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      // You can add navigation to login screen here
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
