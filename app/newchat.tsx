import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import { chatApi } from '@/services/api';

interface SearchUser {
  id: string;  // Changed from _id to id to match API response
  username: string;
  email?: string; // Make email optional since it might not always be present
}

interface SearchResponse {
  status: string;
  results: number;
  data: {
    users: SearchUser[];
  };
}

export default function NewChatScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await chatApi.searchUsers(query.trim());
      console.log('Search results:', response);
      
      if (response.status === 'success' && response.data && response.data.users) {
        setSearchResults(response.data.users);
      } else {
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user: SearchUser) => {
    // Toggle selection - if same user is clicked, deselect; otherwise select new user
    setSelectedUser(selectedUser?.id === user.id ? null : user);
  };

  const handleCreateChat = async () => {
    if (!selectedUser) {
      Alert.alert('Error', 'Please select a user');
      return;
    }

    setIsCreating(true);
    try {
      // For direct chats, send only participantId (single user)
      const chatData = {
        type: 'direct' as const,
        participantId: selectedUser.id
      };

      console.log('Creating chat with data:', chatData);
      
      const response = await chatApi.createChat(chatData);
      console.log('Chat created:', response);

      if (response.success && response.data) {
        // Navigate to the new chat and go back to home to refresh the chat list
        router.push(`/chat/${response.data._id}`);
      } else {
        Alert.alert('Error', response.message || 'Failed to create chat');
      }
    } catch (error: any) {
      console.error('Create chat error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create chat');
    } finally {
      setIsCreating(false);
    }
  };

  const renderUserItem = ({ item }: { item: SearchUser }) => {
    const isSelected = selectedUser?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.selectedUserItem]}
        onPress={() => handleUserSelect(item)}
      >
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          {item.email && <Text style={styles.userEmail}>{item.email}</Text>}
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Chat</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        {isSearching && <ActivityIndicator size="small" color="#007AFF" />}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>💬 Select a user to start chatting</Text>
      </View>

      {/* Selected User Display */}
      {selectedUser && (
        <View style={styles.selectedUsersContainer}>
          <Text style={styles.selectedUsersTitle}>Selected:</Text>
          <View style={styles.selectedUsersList}>
            <View style={styles.selectedUserChip}>
              <Text style={styles.selectedUserChipText}>{selectedUser.username}</Text>
              <TouchableOpacity
                onPress={() => setSelectedUser(null)}
                style={styles.removeUserButton}
              >
                <Text style={styles.removeUserText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Search Results */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        style={styles.usersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          searchQuery.length >= 2 && !isSearching ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No users found</Text>
            </View>
          ) : searchQuery.length < 2 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Start typing to search users...</Text>
            </View>
          ) : null
        }
      />

      {/* Create Chat Button */}
      {selectedUser && (
        <TouchableOpacity
          style={[styles.createButton, isCreating && styles.createButtonDisabled]}
          onPress={handleCreateChat}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Chat</Text>
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  chatTypeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTypeButton: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  activeTypeButtonText: {
    color: '#fff',
  },
  groupNameContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
  },
  selectedUsersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  selectedUsersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  selectedUsersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 2,
  },
  selectedUserChipText: {
    fontSize: 14,
    color: '#1976d2',
    marginRight: 4,
  },
  removeUserButton: {
    marginLeft: 4,
  },
  removeUserText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  usersList: {
    flex: 1,
    backgroundColor: '#fff',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedUserItem: {
    backgroundColor: '#f0f8ff',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
  },
});
