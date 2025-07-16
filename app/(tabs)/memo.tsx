import { Plus, Search, Settings, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Memo {
  id: number;
  title: string;
  content: string;
  timestamp: string;
  color: string;
}

export default function MemoScreen() {
  const [memos, setMemos] = useState<Memo[]>([
    {
      id: 1,
      title: 'Meeting Notes',
      content: 'Discuss project timeline and deliverables...',
      timestamp: '2 hours ago',
      color: '#FFE4B5',
    },
    {
      id: 2,
      title: 'Shopping List',
      content: 'Milk, Bread, Eggs, Fruits, Vegetables...',
      timestamp: '1 day ago',
      color: '#E6F3FF',
    },
    {
      id: 3,
      title: 'Ideas',
      content: 'New app features, UI improvements, user feedback...',
      timestamp: '3 days ago',
      color: '#F0F8E6',
    },
    {
      id: 4,
      title: 'Travel Plans',
      content: 'Book flights, hotel reservations, itinerary...',
      timestamp: '1 week ago',
      color: '#FFE6F3',
    },
  ]);

  const [showAddMemo, setShowAddMemo] = useState(false);
  const [newMemoTitle, setNewMemoTitle] = useState('');
  const [newMemoContent, setNewMemoContent] = useState('');

  const colors = ['#FFE4B5', '#E6F3FF', '#F0F8E6', '#FFE6F3', '#E6E6FA'];

  const handleAddMemo = () => {
    if (newMemoTitle.trim() && newMemoContent.trim()) {
      const newMemo: Memo = {
        id: Date.now(),
        title: newMemoTitle,
        content: newMemoContent,
        timestamp: 'Just now',
        color: colors[Math.floor(Math.random() * colors.length)],
      };
      setMemos([newMemo, ...memos]);
      setNewMemoTitle('');
      setNewMemoContent('');
      setShowAddMemo(false);
    }
  };

  const handleDeleteMemo = (id: number) => {
    setMemos(memos.filter(memo => memo.id !== id));
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

  const renderMemoList = () => (
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
            <Text style={styles.memoTimestamp}>{memo.timestamp}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Memo</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Search size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Settings size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
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