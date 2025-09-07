import { Plus, Search, Settings, Trash2, AlertCircle } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import MemoService, { Memo } from '../../services/MemoService';
import { useFocusEffect } from '@react-navigation/native';

export default function MemoScreen() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [showAddMemo, setShowAddMemo] = useState(false);
  const [newMemoTitle, setNewMemoTitle] = useState('');
  const [newMemoContent, setNewMemoContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Load memos when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadMemos();
    }, [])
  );

  const loadMemos = async () => {
    try {
      setIsLoading(true);
      const loadedMemos = await MemoService.loadMemos();
      setMemos(loadedMemos);
    } catch (error) {
      console.error('Error loading memos:', error);
      Alert.alert('Error', 'Failed to load memos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMemo = async () => {
    if (newMemoTitle.trim() && newMemoContent.trim()) {
      try {
        const newMemo = await MemoService.addMemo(newMemoTitle, newMemoContent);
        setMemos([newMemo, ...memos]);
        setNewMemoTitle('');
        setNewMemoContent('');
        setShowAddMemo(false);
      } catch (error) {
        console.error('Error adding memo:', error);
        Alert.alert('Error', 'Failed to add memo');
      }
    } else {
      Alert.alert('Validation Error', 'Please enter both title and content');
    }
  };

  const handleDeleteMemo = async (id: string) => {
    Alert.alert(
      'Delete Memo',
      'Are you sure you want to delete this memo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await MemoService.deleteMemo(id);
              setMemos(memos.filter(memo => memo.id !== id));
            } catch (error) {
              console.error('Error deleting memo:', error);
              Alert.alert('Error', 'Failed to delete memo');
            }
          },
        },
      ]
    );
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      loadMemos();
    } else {
      try {
        const searchResults = await MemoService.searchMemos(query);
        setMemos(searchResults);
      } catch (error) {
        console.error('Error searching memos:', error);
        Alert.alert('Error', 'Failed to search memos');
      }
    }
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setSearchQuery('');
      loadMemos();
    }
  };

  const renderAddMemoForm = () => (
    <View style={styles.addMemoForm}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={() => setShowAddMemo(false)}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>New Memo</Text>
        <TouchableOpacity onPress={handleAddMemo}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>
      
      <TextInput
        style={styles.titleInput}
        placeholder="Enter title..."
        value={newMemoTitle}
        onChangeText={setNewMemoTitle}
        autoFocus
      />
      
      <TextInput
        style={styles.contentInput}
        placeholder="Enter your memo content..."
        value={newMemoContent}
        onChangeText={setNewMemoContent}
        multiline
        textAlignVertical="top"
      />
    </View>
  );

  const renderSearchBar = () => (
    showSearch && (
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search memos..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoFocus
        />
      </View>
    )
  );

  const renderMemoList = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading memos...</Text>
        </View>
      );
    }

    if (memos.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No memos yet</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'No memos match your search' : 'Tap the + button to create your first memo'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.memoList}>
        <View style={styles.memoGrid}>
          {memos.map((memo) => (
            <View key={memo.id} style={[styles.memoCard, { backgroundColor: memo.color }]}>
              <View style={styles.memoHeader}>
                <Text style={styles.memoTitle} numberOfLines={1}>
                  {memo.title}
                </Text>
                <TouchableOpacity onPress={() => handleDeleteMemo(memo.id)}>
                  <Trash2 size={16} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <Text style={styles.memoContent} numberOfLines={4}>
                {memo.content}
              </Text>
              <Text style={styles.memoTimestamp}>
                {MemoService.formatTimestamp(memo.timestamp)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Memo</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleSearch}>
            <Search size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Settings size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {renderSearchBar()}
      
      {showAddMemo ? renderAddMemoForm() : renderMemoList()}
      
      {!showAddMemo && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddMemo(true)}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      )}
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  memoList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  memoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  memoCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    minHeight: 150,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  memoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  memoContent: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 10,
    flex: 1,
  },
  memoTimestamp: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  addButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addMemoForm: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8E8E93',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#ffffff',
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    lineHeight: 24,
  },
});