// services/socketService.ts
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from './notificationService';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL;

// Log Socket URL for debugging
console.log('SOCKET_URL configured as:', SOCKET_URL);

if (!SOCKET_URL) {
  console.error('EXPO_PUBLIC_SOCKET_URL is not defined!');
}

// App state reference for notification logic
let appStateRef: {
  currentChatId: string | null;
  isAppInForeground: () => boolean;
  isInChat: (chatId: string) => boolean;
} | null = null;

// Function to set app state reference
export const setAppStateRef = (ref: typeof appStateRef) => {
  appStateRef = ref;
};

class SocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;

  async connect(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userIdStored = await AsyncStorage.getItem('userId');
      
      if (!token) {
        console.log('No auth token found, cannot connect to socket');
        return;
      }

      this.currentUserId = userIdStored;
      console.log('🔐 Connecting with userId:', this.currentUserId);

      this.socket = io(SOCKET_URL, {
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
      console.log('⌨️ Emitting startTyping for chat:', chatId);
      // Use new unified typing event
      this.socket.emit('typing', { chatId, isTyping: true });
      // Keep legacy support during transition
      this.socket.emit('startTyping', { chatId });
    }
  }

  stopTyping(chatId: string): void {
    if (this.socket) {
      console.log('⌨️ Emitting stopTyping for chat:', chatId);
      // Use new unified typing event
      this.socket.emit('typing', { chatId, isTyping: false });
      // Keep legacy support during transition
      this.socket.emit('stopTyping', { chatId });
    }
  }

  // Event listeners
  onNewMessage(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on('newMessage', async (message) => {
        // Trigger notification for new message
        await this.handleNewMessageNotification(message);
        // Call the original callback
        callback(message);
      });
    }
  }

  // Handle new message notification
  private async handleNewMessageNotification(message: any): Promise<void> {
    try {
      // Don't send notification for own messages
      // Check both _id (from backend) and id (fallback) and senderId (alternative field)
      const messageSenderId = message.sender?._id || message.sender?.id || message.senderId;
      if (messageSenderId === this.currentUserId) {
        console.log('📱 Ignoring notification for own message:', {
          messageSenderId,
          currentUserId: this.currentUserId,
          senderObject: message.sender
        });
        return;
      }

      console.log('📱 Notification check for message from:', {
        messageSenderId,
        currentUserId: this.currentUserId,
        shouldSend: messageSenderId !== this.currentUserId
      });

      // Only send notification if the app is in background or user is not in this chat
      if (this.shouldSendNotification(message)) {
        await notificationService.sendMessageNotification(
          message.sender?.username || message.sender?.fullName || 'Someone',
          message.content || 'New message',
          message.chatId || message.chat
        );
      }
    } catch (error) {
      console.error('Error handling new message notification:', error);
    }
  }

  // Determine if notification should be sent
  private shouldSendNotification(message: any): boolean {
    // Support both chatId and chat field names from backend
    const messageChat = message.chatId || message.chat;
    
    console.log('📱 Checking if should send notification for message:', {
      chatId: messageChat,
      sender: message.sender?.username,
      content: message.content?.substring(0, 50),
      appStateRef: !!appStateRef
    });

    // Don't send notification if we don't have app state reference
    if (!appStateRef) {
      console.log('📱 No app state reference, sending notification');
      return true;
    }

    // Don't send notification if user is currently in this chat and app is in foreground
    if (appStateRef.isAppInForeground() && appStateRef.isInChat(messageChat)) {
      console.log('📱 User is in current chat and app is in foreground, not sending notification');
      return false;
    }

    // Send notification if app is in background or user is in different chat
    console.log('📱 App is in background or user is in different chat, sending notification');
    return true;
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
      // Support new unified typing event
      this.socket.on('typing', (data: { userId: string; chatId: string; isTyping: boolean; username?: string }) => {
        console.log('⌨️ Typing event received:', data, 'currentUser:', this.currentUserId);
        
        // Don't show typing indicator for own typing
        if (data.userId === this.currentUserId) {
          console.log('⌨️ Ignoring own typing indicator');
          return;
        }
        
        callback(data);
      });

      // Support legacy events during transition
      this.socket.on('userStartTyping', (data) => {
        console.log('⌨️ Legacy userStartTyping:', data, 'currentUser:', this.currentUserId);
        
        // Don't show typing indicator for own typing
        if (data.userId === this.currentUserId) {
          console.log('⌨️ Ignoring own legacy typing indicator');
          return;
        }
        
        callback({ ...data, isTyping: true });
      });
      
      this.socket.on('userStopTyping', (data) => {
        console.log('⌨️ Legacy userStopTyping:', data, 'currentUser:', this.currentUserId);
        
        // Don't show typing indicator for own typing
        if (data.userId === this.currentUserId) {
          console.log('⌨️ Ignoring own legacy typing indicator');
          return;
        }
        
        callback({ ...data, isTyping: false });
      });
    }
  }

  onUserOnline(callback: (data: { userId: string; status: string }) => void): void {
    if (this.socket) {
      this.socket.on('user_online', (data) => {
        console.log('👋 User online event:', data, 'currentUser:', this.currentUserId);
        
        // Don't show status for own user
        if (data.userId === this.currentUserId) {
          console.log('👋 Ignoring own online status');
          return;
        }
        
        callback(data);
      });
    }
  }

  onUserOffline(callback: (data: { userId: string; status: string }) => void): void {
    if (this.socket) {
      this.socket.on('user_offline', (data) => {
        console.log('👋 User offline event:', data, 'currentUser:', this.currentUserId);
        
        // Don't show status for own user
        if (data.userId === this.currentUserId) {
          console.log('👋 Ignoring own offline status');
          return;
        }
        
        callback(data);
      });
    }
  }

  // Event listeners for chat list updates
  onChatListUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('chatListUpdate', callback);
    }
  }

  onChatUpdated(callback: (chat: any) => void): void {
    if (this.socket) {
      this.socket.on('chatUpdated', callback);
    }
  }

  onNewChat(callback: (chat: any) => void): void {
    if (this.socket) {
      this.socket.on('newChat', callback);
    }
  }

  onChatDeleted(callback: (data: { chatId: string }) => void): void {
    if (this.socket) {
      this.socket.on('chatDeleted', callback);
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
      this.socket.off('typing');
      this.socket.off('userStartTyping');
      this.socket.off('userStopTyping');
    }
  }

  // Mark messages as read
  markMessagesAsRead(chatId: string): void {
    if (this.socket) {
      console.log('📖 Marking messages as read for chat:', chatId);
      this.socket.emit('markAsRead', { chatId });
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
