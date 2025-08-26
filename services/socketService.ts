// services/socketService.ts
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.8.145:5000';

class SocketService {
  private socket: Socket | null = null;

  async connect(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found, cannot connect to socket');
        return;
      }

      this.socket = io("http://192.168.8.137:5000", {
        auth: {
          token,
        },
        transports: ['websocket'],
        autoConnect: true,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Socket connection error:', error);
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to server:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    // Add ping/pong handlers for testing
    this.socket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });

    // Debug: Listen to all events
    this.socket.onAny((eventName, data) => {
      console.log('📡 Socket event received:', eventName, data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Chat related methods
  joinChat(chatId: string): void {
    if (this.socket) {
      console.log('📱 Joining chat:', chatId);
      this.socket.emit('joinChat', chatId); // Changed from 'join_chat' to 'joinChat'
    }
  }

  leaveChat(chatId: string): void {
    if (this.socket) {
      console.log('🚪 Leaving chat:', chatId);
      this.socket.emit('leaveChat', chatId); // Changed from 'leave_chat' to 'leaveChat'
    }
  }

  sendMessage(chatId: string, content: string, type: string = 'text'): void {
    if (this.socket) {
      console.log('📤 Sending message via socket:', { chatId, content, type });
      this.socket.emit('sendMessage', {
        chatId,
        content,
        messageType: type,
      });
    } else {
      console.error('❌ Cannot send message: Socket not connected');
    }
  }

  startTyping(chatId: string): void {
    if (this.socket) {
      this.socket.emit('startTyping', { chatId });
    }
  }

  stopTyping(chatId: string): void {
    if (this.socket) {
      this.socket.emit('stopTyping', { chatId });
    }
  }

  // Event listeners
  onNewMessage(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on('newMessage', callback);
    }
  }

  onMessageBlocked(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('messageBlocked', callback);
    }
  }

  onMessageDelivered(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('message_delivered', callback);
    }
  }

  onUserTyping(callback: (data: { userId: string; chatId: string; isTyping: boolean; username?: string }) => void): void {
    if (this.socket) {
      this.socket.on('userStartTyping', (data) => callback({ ...data, isTyping: true }));
      this.socket.on('userStopTyping', (data) => callback({ ...data, isTyping: false }));
    }
  }

  onUserOnline(callback: (data: { userId: string; status: string }) => void): void {
    if (this.socket) {
      this.socket.on('user_online', callback);
    }
  }

  onUserOffline(callback: (data: { userId: string; status: string }) => void): void {
    if (this.socket) {
      this.socket.on('user_offline', callback);
    }
  }

  // Remove event listeners
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  removeListener(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  // Remove specific listeners for cleanup
  offMessageBlocked(): void {
    if (this.socket) {
      this.socket.off('messageBlocked');
    }
  }

  offNewMessage(): void {
    if (this.socket) {
      this.socket.off('newMessage');
    }
  }

  offTypingEvents(): void {
    if (this.socket) {
      this.socket.off('userStartTyping');
      this.socket.off('userStopTyping');
    }
  }

  // Get socket instance for custom events
  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
