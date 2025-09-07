import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { 
  ArrowLeft,
  Bell,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Moon,
  Smartphone
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../services/notificationService';

interface NotificationSettings {
  messageNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showPreview: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    messageNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    showPreview: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
    },
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const handleToggle = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    const newSettings = {
      ...settings,
      quietHours: { ...settings.quietHours, enabled }
    };
    saveSettings(newSettings);
  };

  const handleBack = () => {
    router.back();
  };

  const requestNotificationPermission = async () => {
    try {
      const hasPermission = await notificationService.requestNotificationPermission();
      if (hasPermission) {
        Alert.alert(
          '✅ Notifications Enabled',
          'Great! You\'ll now receive notifications when you get new messages.',
          [{ text: 'Awesome!' }]
        );
        // Update settings to enable notifications
        const newSettings = { ...settings, messageNotifications: true };
        await saveSettings(newSettings);
      } else {
        Alert.alert(
          '❌ Notifications Disabled',
          'No worries! You can always enable notifications later in your device settings or try again here.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      Alert.alert('Error', 'Failed to request notification permissions. Please try again.');
    }
  };

  const testNotification = async () => {
    try {
      await notificationService.sendTestNotification();
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Enable Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message Notifications</Text>
          
          <View style={styles.settingItem}>
            <Bell size={20} color="#007AFF" />
            <Text style={styles.settingText}>Enable Notifications</Text>
            <Switch
              value={settings.messageNotifications}
              onValueChange={(value) => handleToggle('messageNotifications', value)}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Text style={styles.settingDescription}>
            Receive notifications when you get new messages
          </Text>
        </View>

        {/* Notification Options */}
        {settings.messageNotifications && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notification Options</Text>
              
              <View style={styles.settingItem}>
                {settings.soundEnabled ? (
                  <Volume2 size={20} color="#8E8E93" />
                ) : (
                  <VolumeX size={20} color="#8E8E93" />
                )}
                <Text style={styles.settingText}>Sound</Text>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={(value) => handleToggle('soundEnabled', value)}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingItem}>
                <Smartphone size={20} color="#8E8E93" />
                <Text style={styles.settingText}>Vibration</Text>
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={(value) => handleToggle('vibrationEnabled', value)}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingItem}>
                {settings.showPreview ? (
                  <Eye size={20} color="#8E8E93" />
                ) : (
                  <EyeOff size={20} color="#8E8E93" />
                )}
                <Text style={styles.settingText}>Show Message Preview</Text>
                <Switch
                  value={settings.showPreview}
                  onValueChange={(value) => handleToggle('showPreview', value)}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Quiet Hours */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quiet Hours</Text>
              
              <View style={styles.settingItem}>
                <Moon size={20} color="#8E8E93" />
                <Text style={styles.settingText}>Enable Quiet Hours</Text>
                <Switch
                  value={settings.quietHours.enabled}
                  onValueChange={handleQuietHoursToggle}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {settings.quietHours.enabled && (
                <>
                  <View style={styles.timeSettingItem}>
                    <Text style={styles.timeLabel}>From:</Text>
                    <Text style={styles.timeValue}>{settings.quietHours.startTime}</Text>
                  </View>
                  
                  <View style={styles.timeSettingItem}>
                    <Text style={styles.timeLabel}>To:</Text>
                    <Text style={styles.timeValue}>{settings.quietHours.endTime}</Text>
                  </View>
                </>
              )}

              <Text style={styles.settingDescription}>
                No notifications will be sent during quiet hours
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={requestNotificationPermission}
              >
                <Text style={styles.actionButtonText}>Enable Push Notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]} 
                onPress={testNotification}
              >
                <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                  Send Test Notification
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
    flex: 1,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
    paddingHorizontal: 20,
    paddingTop: 8,
    lineHeight: 20,
  },
  timeSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 8,
  },
  timeLabel: {
    fontSize: 16,
    color: '#8E8E93',
    width: 50,
  },
  timeValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginVertical: 8,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
});
