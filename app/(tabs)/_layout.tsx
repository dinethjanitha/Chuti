import { Tabs } from 'expo-router';
import { FileText, MessageCircle } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="memo"
        options={{
          title: 'Memo',
          tabBarIcon: ({ size, color }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}