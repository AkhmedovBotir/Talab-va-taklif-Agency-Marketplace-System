import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

export default function TabsLayout() {
  const router = useRouter();
  const { unreadCount } = useUnreadNotifications();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: true,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
        },
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Buyurtmalar',
          tabBarLabel: 'Buyurtmalar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/orders-history')}
              style={styles.historyButton}
            >
              <Ionicons name="time-outline" size={24} color="#007AFF" />

            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'So\'rovlar',
          tabBarLabel: 'So\'rovlar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="punkt-requests"
        options={{
          title: 'Punkt So\'rovlari',
          tabBarLabel: 'Punkt So\'rovlari',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          headerShown: false,
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="person" size={size} color={color} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders-history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
});