import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Memo {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const MEMO_STORAGE_KEY = 'chuti_user_memos';

class MemoService {
  private colors = ['#FFE4B5', '#E6F3FF', '#F0F8E6', '#FFE6F3', '#E6E6FA', '#FFE4E1', '#F0FFFF', '#E0FFE0'];

  // Load all memos from AsyncStorage
  async loadMemos(): Promise<Memo[]> {
    try {
      const storedMemos = await AsyncStorage.getItem(MEMO_STORAGE_KEY);
      if (storedMemos) {
        const parsedMemos = JSON.parse(storedMemos);
        // Convert timestamp strings back to Date objects
        return parsedMemos.map((memo: any) => ({
          ...memo,
          timestamp: new Date(memo.timestamp),
          createdAt: new Date(memo.createdAt),
          updatedAt: new Date(memo.updatedAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading memos from AsyncStorage:', error);
      return [];
    }
  }

  // Save all memos to AsyncStorage
  async saveMemos(memos: Memo[]): Promise<void> {
    try {
      await AsyncStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(memos));
    } catch (error) {
      console.error('Error saving memos to AsyncStorage:', error);
      throw new Error('Failed to save memos');
    }
  }

  // Add a new memo
  async addMemo(title: string, content: string): Promise<Memo> {
    try {
      const memos = await this.loadMemos();
      const newMemo: Memo = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: title.trim(),
        content: content.trim(),
        timestamp: new Date(),
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedMemos = [newMemo, ...memos];
      await this.saveMemos(updatedMemos);
      return newMemo;
    } catch (error) {
      console.error('Error adding memo:', error);
      throw new Error('Failed to add memo');
    }
  }

  // Update an existing memo
  async updateMemo(id: string, title: string, content: string): Promise<Memo | null> {
    try {
      const memos = await this.loadMemos();
      const memoIndex = memos.findIndex(memo => memo.id === id);
      
      if (memoIndex === -1) {
        throw new Error('Memo not found');
      }

      const updatedMemo: Memo = {
        ...memos[memoIndex],
        title: title.trim(),
        content: content.trim(),
        updatedAt: new Date(),
      };

      memos[memoIndex] = updatedMemo;
      await this.saveMemos(memos);
      return updatedMemo;
    } catch (error) {
      console.error('Error updating memo:', error);
      throw new Error('Failed to update memo');
    }
  }

  // Delete a memo
  async deleteMemo(id: string): Promise<boolean> {
    try {
      const memos = await this.loadMemos();
      const filteredMemos = memos.filter(memo => memo.id !== id);
      
      if (filteredMemos.length === memos.length) {
        throw new Error('Memo not found');
      }

      await this.saveMemos(filteredMemos);
      return true;
    } catch (error) {
      console.error('Error deleting memo:', error);
      throw new Error('Failed to delete memo');
    }
  }

  // Search memos by title or content
  async searchMemos(query: string): Promise<Memo[]> {
    try {
      const memos = await this.loadMemos();
      if (!query.trim()) {
        return memos;
      }

      const searchTerm = query.toLowerCase().trim();
      return memos.filter(memo => 
        memo.title.toLowerCase().includes(searchTerm) ||
        memo.content.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching memos:', error);
      return [];
    }
  }

  // Get memo by ID
  async getMemoById(id: string): Promise<Memo | null> {
    try {
      const memos = await this.loadMemos();
      return memos.find(memo => memo.id === id) || null;
    } catch (error) {
      console.error('Error getting memo by ID:', error);
      return null;
    }
  }

  // Clear all memos (for development/testing purposes)
  async clearAllMemos(): Promise<void> {
    try {
      await AsyncStorage.removeItem(MEMO_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing all memos:', error);
      throw new Error('Failed to clear memos');
    }
  }

  // Export memos as JSON string (for backup)
  async exportMemos(): Promise<string> {
    try {
      const memos = await this.loadMemos();
      return JSON.stringify(memos, null, 2);
    } catch (error) {
      console.error('Error exporting memos:', error);
      throw new Error('Failed to export memos');
    }
  }

  // Import memos from JSON string (for restore)
  async importMemos(jsonString: string, replaceExisting: boolean = false): Promise<number> {
    try {
      const importedMemos: Memo[] = JSON.parse(jsonString).map((memo: any) => ({
        ...memo,
        timestamp: new Date(memo.timestamp),
        createdAt: new Date(memo.createdAt),
        updatedAt: new Date(memo.updatedAt),
      }));

      let existingMemos: Memo[] = [];
      if (!replaceExisting) {
        existingMemos = await this.loadMemos();
      }

      const allMemos = [...importedMemos, ...existingMemos];
      await this.saveMemos(allMemos);
      return importedMemos.length;
    } catch (error) {
      console.error('Error importing memos:', error);
      throw new Error('Failed to import memos');
    }
  }

  // Format timestamp for display
  formatTimestamp(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 10080) { // 7 days
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

export default new MemoService();
