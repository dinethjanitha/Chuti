import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { 
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Shield
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user } = useAuth();

  const handleBack = () => {
    router.back();
  };

  const getAccountType = () => {
    if (!user) return 'Unknown';
    
    if (user.role === 'admin') return 'Admin';
    if (user.age >= 13) return 'Parent';
    return 'Child';
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Picture Placeholder */}
        <View style={styles.profileSection}>
          <View style={styles.profilePicture}>
            <User size={60} color="#FFFFFF" />
          </View>
          <Text style={styles.profileName}>
            {user.fullName || user.username}
          </Text>
          <Text style={styles.profileUsername}>
            @{user.username}
          </Text>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          {/* Username */}
          <View style={styles.infoItem}>
            <View style={styles.infoHeader}>
              <User size={20} color="#8E8E93" />
              <Text style={styles.infoLabel}>Username</Text>
            </View>
            <Text style={styles.infoValue}>@{user.username}</Text>
          </View>

          {/* Full Name */}
          <View style={styles.infoItem}>
            <View style={styles.infoHeader}>
              <User size={20} color="#8E8E93" />
              <Text style={styles.infoLabel}>Name</Text>
            </View>
            <Text style={styles.infoValue}>{user.fullName || user.username}</Text>
          </View>

          {/* Email */}
          <View style={styles.infoItem}>
            <View style={styles.infoHeader}>
              <Mail size={20} color="#8E8E93" />
              <Text style={styles.infoLabel}>Email</Text>
            </View>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>

          {/* Age */}
          <View style={styles.infoItem}>
            <View style={styles.infoHeader}>
              <Calendar size={20} color="#8E8E93" />
              <Text style={styles.infoLabel}>Age</Text>
            </View>
            <Text style={styles.infoValue}>{user.age} years old</Text>
          </View>

          {/* Account Type */}
          <View style={styles.infoItem}>
            <View style={styles.infoHeader}>
              <Shield size={20} color="#8E8E93" />
              <Text style={styles.infoLabel}>Account Type</Text>
            </View>
            <Text style={styles.infoValue}>{getAccountType()}</Text>
          </View>
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
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 28,
  },
  editInput: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#007AFF',
    paddingBottom: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
});
