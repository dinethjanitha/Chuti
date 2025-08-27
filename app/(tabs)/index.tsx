import { router, useFocusEffect } from 'expo-router';
import { Search, Settings, Plus } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { chatApi } from '@/services/api';
import socketService from '@/services/socketService';

interface Chat {
  _id: string;
  name?: string;
  chatType: 'direct' | 'group'; // Changed from 'type' to 'chatType' to match backend
  lastMessage?: {
    content: string;
    createdAt: string;
    sender: {
      _id: string;
      username: string;
    };
  };
  participants: {
    user: { // Changed structure to match populated data
      _id: string;
      username: string;
      fullName?: string;
      profilePicture?: string;
    };
  }[];
  unreadCount?: number; // Made optional since it might not always be present
}

export default function ChatListScreen() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load user's chats
  const loadChats = async () => {
    try {
      const response = await chatApi.getUserChats();
      console.log('getUserChats response:', response);
      
      // Fix: API returns response.data, not response.chats
      if (response.success && response.data) {
        setChats(response.data);
      } else {
        setChats([]);
      }
    } catch (error: any) {
      console.error('Error loading chats:', error);
      if (error.response?.status !== 401) {
        Alert.alert('Error', 'Failed to load chats');
      }
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadChats();
    
    // Initialize socket connection
    if (!socketService.isConnected()) {
      console.log('Initializing socket connection for chat list...');
      socketService.connect().then(() => {
        console.log('Socket connected for chat list');
      }).catch((error) => {
        console.error('Socket connection failed:', error);
      });
    }
  }, []);

  // Refresh chats when screen comes into focus (e.g., after creating a new chat)
  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [])
  );

  // Set up real-time listeners
  useEffect(() => {
    if (!socketService.isConnected()) {
      console.log('Socket not connected, attempting to connect...');
      socketService.connect();
      return;
    }

    console.log('Setting up chat list socket listeners...');

    // Listen for new messages
    socketService.onNewMessage((message) => {
      console.log('📨 New message received in chat list:', {
        messageId: message._id,
        content: message.content,
        chatId: message.chat || message.chatId,
        sender: message.sender?.username
      });

      setChats(prevChats => 
        prevChats.map(chat => {
          // Check both message.chat and message.chatId for compatibility
          const isMessageForThisChat = chat._id === (message.chat || message.chatId);
          
          if (isMessageForThisChat) {
            console.log('Updating chat in list:', chat._id);
            return {
              ...chat,
              lastMessage: {
                content: message.content,
                createdAt: message.createdAt,
                sender: message.sender,
              },
              unreadCount: (chat.unreadCount || 0) + 1,
            };
          }
          return chat;
        })
      );
    });

    // Listen for deleted chats
    const socketInstance = socketService.getSocket();
    if (socketInstance) {
      socketInstance.on('chatDeleted', (data) => {
        console.log('Chat deleted in list:', data);
        setChats(prevChats => prevChats.filter(chat => chat._id !== data.chatId));
      });
    }

    return () => {
      console.log('Cleaning up chat list socket listeners');
      socketService.removeListener('newMessage');
      
      // Clean up deletion listener
      const socketInstance = socketService.getSocket();
      if (socketInstance) {
        socketInstance.off('chatDeleted');
      }
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat: Chat) => {
    // Reset unread count when opening a chat
    setChats(prevChats => 
      prevChats.map(c => 
        c._id === chat._id 
          ? { ...c, unreadCount: 0 }
          : c
      )
    );
    
    router.push(`/chat/${chat._id}`);
  };

  const getChatName = (chat: Chat) => {
    if (chat.chatType === 'group') {
      return chat.name || 'Group Chat';
    }
    
    // For direct chats, show the other participant's name
    const otherParticipant = chat.participants.find(p => p.user._id !== user?.id);
    return otherParticipant?.user.username || 'Unknown User';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Chuti App</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Search size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Settings size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={styles.chatList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading chats...</Text>
          </View>
        ) : chats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubText}>Start a conversation to see it here</Text>
          </View>
        ) : (
          chats.map((chat) => (
            <TouchableOpacity
              key={chat._id}
              style={styles.chatItem}
              onPress={() => handleChatPress(chat)}
              activeOpacity={0.7}
            >
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {getChatName(chat).charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>{getChatName(chat)}</Text>
                  {chat.lastMessage && (
                    <Text style={styles.chatTime}>
                      {formatTimestamp(chat.lastMessage.createdAt)}
                    </Text>
                  )}
                </View>
                <View style={styles.chatPreview}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {chat.lastMessage 
                      ? `${chat.lastMessage.sender.username}: ${chat.lastMessage.content}`
                      : 'No messages yet'
                    }
                  </Text>
                  {(chat.unreadCount || 0) > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>{chat.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/newchat')}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 8,
  },
  chatList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    backgroundColor: '#ffffff',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  chatTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#25D366',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});