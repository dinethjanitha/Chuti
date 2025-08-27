import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  LogOut, 
  Edit3,
  Settings,
  HelpCircle,
  Save,
  X
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({
    username: user?.username || '',
    fullName: user?.fullName || user?.username || '',
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Profile: Starting logout...');
              await logout();
              console.log('Profile: Logout successful, AuthGuard will handle redirect');
              // AuthGuard will automatically redirect to login when isAuthenticated becomes false
            } catch (logoutError) {
              console.error('Profile: Logout error:', logoutError);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    setEditData({
      username: user?.username || '',
      fullName: user?.fullName || user?.username || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditData({
      username: user?.username || '',
      fullName: user?.fullName || user?.username || '',
    });
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!editData.username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    if (!editData.fullName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(editData.username)) {
      Alert.alert('Error', 'Username can only contain letters, numbers, and underscores');
      return;
    }

    if (editData.username.length < 3 || editData.username.length > 20) {
      Alert.alert('Error', 'Username must be between 3-20 characters');
      return;
    }

    try {
      setIsLoading(true);
      
      const updateData: { username?: string; fullName?: string } = {};
      
      // Only include changed fields
      if (editData.username !== user?.username) {
        updateData.username = editData.username;
      }
      if (editData.fullName !== (user?.fullName || user?.username)) {
        updateData.fullName = editData.fullName;
      }

      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        return;
      }

      await updateProfile(updateData);
      setIsEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert(
        'Error', 
        error.message || 'Failed to update profile'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleHelp = () => {
    Alert.alert('Help', 'For help, please contact support at help@chuti.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={40} color="#007AFF" />
            </View>
          </View>
          
          <View style={styles.userInfo}>
            {isEditing ? (
              <>
                <TextInput
                  style={styles.editInput}
                  value={editData.fullName}
                  onChangeText={(text) => setEditData(prev => ({ ...prev, fullName: text }))}
                  placeholder="Enter your name"
                  maxLength={50}
                />
                <TextInput
                  style={[styles.editInput, styles.usernameInput]}
                  value={editData.username}
                  onChangeText={(text) => setEditData(prev => ({ ...prev, username: text }))}
                  placeholder="Enter username"
                  autoCapitalize="none"
                  maxLength={20}
                />
              </>
            ) : (
              <>
                <Text style={styles.userName}>{user?.fullName || user?.username}</Text>
                <Text style={styles.userUsername}>@{user?.username}</Text>
              </>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancelEdit}
                disabled={isLoading}
              >
                <X size={16} color="#FF3B30" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Save size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Edit3 size={16} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* User Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoItem}>
            <Mail size={20} color="#8E8E93" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Calendar size={20} color="#8E8E93" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{user?.age} years old</Text>
            </View>
          </View>

          {user?.parentEmail && (
            <View style={styles.infoItem}>
              <Shield size={20} color="#8E8E93" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Parent Email</Text>
                <Text style={styles.infoValue}>{user.parentEmail}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoItem}>
            <User size={20} color="#8E8E93" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Account Type</Text>
              <Text style={styles.infoValue}>
                {user?.role === 'children' ? 'Children Account' : 
                 user?.role === 'user' ? 'User Account' : 
                 user?.role === 'moderator' ? 'Moderator Account' : 
                 user?.role === 'admin' ? 'Admin Account' : 'Unknown Account'}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
            <Settings size={20} color="#8E8E93" />
            <Text style={styles.menuText}>Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleHelp}>
            <HelpCircle size={20} color="#8E8E93" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Chuti - Safe Chat for Kids</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 16,
    color: '#8E8E93',
  },
  editButton: {
    padding: 8,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    padding: 8,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  editInput: {
    fontSize: 16,
    color: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#007AFF',
    paddingBottom: 4,
    marginBottom: 8,
  },
  usernameInput: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
    flex: 1,
  },
  menuArrow: {
    fontSize: 20,
    color: '#C7C7CC',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: '#C7C7CC',
  },
});
