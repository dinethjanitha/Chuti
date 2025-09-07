import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export interface NotificationSettings {
  messageNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showPreview: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string;   // "07:00"
  };
}

class NotificationService {
  private permissionGranted: boolean = false;
  private notificationListener: any = null;
  private responseListener: any = null;

  // Setup notifications and request permissions
  async setupNotifications(): Promise<boolean> {
    try {
      // Check if this is a physical device
      if (!Device.isDevice) {
        console.log('📱 Notifications only work on physical devices');
        return false;
      }

      // Check if notifications are enabled in settings
      const settings = await this.getNotificationSettings();
      if (!settings.messageNotifications) {
        console.log('📱 Notifications disabled in settings');
        return false;
      }

      // Configure notification behavior
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: settings.soundEnabled,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Request notification permissions
      const hasPermission = await this.requestNotificationPermission();
      if (hasPermission) {
        console.log('📱 Notification permissions granted');
        this.permissionGranted = true;

        // Set up notification listeners
        this.setupNotificationListeners();

        return true;
      } else {
        console.log('📱 Notification permissions denied');
        return false;
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      return false;
    }
  }

  // Setup notification listeners
  private setupNotificationListeners(): void {
    // Listen for incoming notifications while the app is running
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
    });

    // Listen for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification response:', response);
      
      // Handle notification tap - navigate to specific chat
      const chatId = response.notification.request.content.data?.chatId;
      if (chatId) {
        // You can implement navigation to specific chat here
        console.log('📱 Should navigate to chat:', chatId);
      }
    });
  }

  // Clean up listeners
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Request notification permissions
  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Web notification permission
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
        return false;
      } else {
        // Mobile notification permission request
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          // Show user-friendly dialog if permission denied
          Alert.alert(
            '🔔 Notifications Disabled',
            'To receive message notifications, please enable notifications in your device settings.',
            [
              { text: 'Maybe Later', style: 'cancel' },
              { 
                text: 'Settings', 
                onPress: () => {
                  // You can open device settings here
                  console.log('Should open device settings');
                }
              }
            ]
          );
          return false;
        }

        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Send local notification for new message
  async sendMessageNotification(
    senderName: string, 
    message: string, 
    chatId: string,
    settings?: NotificationSettings
  ) {
    const notificationSettings = settings || await this.getNotificationSettings();
    
    // Check if notifications are enabled
    if (!notificationSettings.messageNotifications) {
      return;
    }

    // Check quiet hours
    if (this.isQuietHours(notificationSettings.quietHours)) {
      return;
    }

    // Check if we have permission
    if (!this.permissionGranted) {
      console.log('📱 No notification permission');
      return;
    }

    try {
      // Prepare notification content
      const messagePreview = notificationSettings.showPreview ? message : 'You have a new message';
      
      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `New message from ${senderName}`,
          body: messagePreview,
          data: { 
            chatId,
            senderName,
            type: 'message'
          },
          sound: notificationSettings.soundEnabled ? 'default' : undefined,
        },
        trigger: null, // Show immediately
      });

      console.log('📱 Notification sent successfully');

      // Store notification for badge count
      await this.incrementUnreadCount();
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Get notification settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      if (settings) {
        return JSON.parse(settings);
      }
    } catch (error) {
      console.error('Error getting notification settings:', error);
    }

    // Return default settings
    return {
      messageNotifications: true,
      soundEnabled: true,
      vibrationEnabled: true,
      showPreview: true,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00',
      },
    };
  }

  // Save notification settings
  async saveNotificationSettings(settings: NotificationSettings) {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  // Check if current time is within quiet hours
  private isQuietHours(quietHours: NotificationSettings['quietHours']): boolean {
    if (!quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = quietHours.startTime;
    const end = quietHours.endTime;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    }
    
    // Handle same-day quiet hours (e.g., 12:00 to 14:00)
    return currentTime >= start && currentTime <= end;
  }

  // Increment unread message count
  private async incrementUnreadCount() {
    try {
      const currentCount = await this.getUnreadMessageCount();
      await AsyncStorage.setItem('unreadMessageCount', (currentCount + 1).toString());
    } catch (error) {
      console.error('Error incrementing unread count:', error);
    }
  }

  // Get unread message count
  async getUnreadMessageCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem('unreadMessageCount');
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Clear unread count (call when user opens the app/chat)
  async clearUnreadCount() {
    try {
      await AsyncStorage.setItem('unreadMessageCount', '0');
    } catch (error) {
      console.error('Error clearing unread count:', error);
    }
  }

  // Show a test notification
  async sendTestNotification() {
    const settings = await this.getNotificationSettings();
    
    if (!settings.messageNotifications) {
      Alert.alert('Notifications Disabled', 'Please enable message notifications first.');
      return;
    }

    if (!this.permissionGranted) {
      Alert.alert('Permission Required', 'Please allow notifications in your device settings.');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Test Notification',
          body: 'This is how you\'ll receive new message notifications!',
          data: { type: 'test' },
          sound: settings.soundEnabled ? 'default' : undefined,
        },
        trigger: null,
      });

      Alert.alert(
        '✅ Test Sent',
        'Check your notification panel to see the test notification!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification.');
    }
  }

  // Check if it's a good time to send notifications
  canSendNotification(): boolean {
    // Add logic here to check:
    // - App is in background
    // - User is not in the specific chat
    // - Notifications are enabled
    return true;
  }
}

export default new NotificationService();
