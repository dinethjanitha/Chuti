import { router } from 'expo-router';
import { Search, Settings } from 'lucide-react-native';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

export default function ChatListScreen() {
  const chats: Chat[] = [
    {
      id: 1,
      name: 'John Doe',
      lastMessage: 'Hey, how are you doing?',
      timestamp: '10:30 AM',
      unreadCount: 2,
    },
    {
      id: 2,
      name: 'Sarah Wilson',
      lastMessage: 'Thanks for the help!',
      timestamp: '9:15 AM',
      unreadCount: 0,
    },
    {
      id: 3,
      name: 'Team Alpha',
      lastMessage: 'Meeting at 3 PM today',
      timestamp: '8:45 AM',
      unreadCount: 5,
    },
    {
      id: 4,
      name: 'Mom',
      lastMessage: 'Don\'t forget dinner tonight',
      timestamp: 'Yesterday',
      unreadCount: 1,
    },
    {
      id: 5,
      name: 'Alex Johnson',
      lastMessage: 'See you tomorrow!',
      timestamp: 'Yesterday',
      unreadCount: 0,
    },
    {
      id: 6,
      name: 'Work Group',
      lastMessage: 'Project deadline extended',
      timestamp: '2 days ago',
      unreadCount: 3,
    },
    {
      id: 7,
      name: 'Emma Davis',
      lastMessage: 'Can you send me the files?',
      timestamp: '2 days ago',
      unreadCount: 0,
    },
    {
      id: 8,
      name: 'Mike Chen',
      lastMessage: 'Great job on the presentation!',
      timestamp: '3 days ago',
      unreadCount: 1,
    },
    {
      id: 9,
      name: 'Family Group',
      lastMessage: 'Planning for weekend trip',
      timestamp: '3 days ago',
      unreadCount: 7,
    },
    {
      id: 10,
      name: 'Lisa Brown',
      lastMessage: 'Happy birthday! 🎉',
      timestamp: '4 days ago',
      unreadCount: 0,
    },
    {
      id: 11,
      name: 'David Kim',
      lastMessage: 'Let\'s catch up soon',
      timestamp: '5 days ago',
      unreadCount: 0,
    },
    {
      id: 12,
      name: 'Study Group',
      lastMessage: 'Exam is next week',
      timestamp: '1 week ago',
      unreadCount: 2,
    },
    {
      id: 13,
      name: 'Anna Rodriguez',
      lastMessage: 'Thanks for the recommendation',
      timestamp: '1 week ago',
      unreadCount: 0,
    },
    {
      id: 14,
      name: 'Gaming Squad',
      lastMessage: 'Online tonight?',
      timestamp: '1 week ago',
      unreadCount: 4,
    },
    {
      id: 15,
      name: 'Tom Wilson',
      lastMessage: 'Coffee tomorrow?',
      timestamp: '2 weeks ago',
      unreadCount: 0,
    },
  ];

  const handleChatPress = (chatId: number) => {
    router.push(`/chat/${chatId}`);
  };

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
      
      <ScrollView style={styles.chatList}>
        {chats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={styles.chatItem}
            onPress={() => handleChatPress(chat.id)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{chat.name.charAt(0)}</Text>
              </View>
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={styles.chatTime}>{chat.timestamp}</Text>
              </View>
              <View style={styles.chatPreview}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {chat.lastMessage}
                </Text>
                {chat.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{chat.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
});