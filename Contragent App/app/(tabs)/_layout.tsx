import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { apiService } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function BadgeIcon({ name, color, size, badgeCount }: { name: any; color: string; size: number; badgeCount: number }) {
  return (
    <View>
      <Ionicons name={name} size={size} color={color} />
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await apiService.getUnreadCount();
        if (response.success) {
          setUnreadCount(response.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 1000); // Refresh every 1 second
    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 10),
          paddingTop: 5,
          height: 60 + insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bosh sahifa',
          tabBarLabel: 'Bosh sahifa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ombor"
        options={{
          title: 'Ombor',
          tabBarLabel: 'Ombor',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="buyurtmalar"
        options={{
          title: 'Buyurtmalar',
          tabBarLabel: 'Buyurtmalar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistika"
        options={{
          title: 'Statistika',
          tabBarLabel: 'Statistika',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <BadgeIcon name="person" size={size} color={color} badgeCount={unreadCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="habarlar"
        options={{
          href: null, // Hide from tab bar
          headerShown: true,
          title: 'Habarlar',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Tabs.Screen
        name="ombor/kategoriyalar"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="ombor/maxsulotlar"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="ombor/subcategory"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="ombor/product/view"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="ombor/product/edit"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="ombor/product/create"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="ombor/product/select-regions"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="ombor/orders"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="ombor/order/view"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="buyurtmalar/order/view"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name='buyurtmalar/history'
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
