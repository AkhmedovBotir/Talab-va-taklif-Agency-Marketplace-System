import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeliveryNotifications } from '../../contexts/DeliveryNotificationsContext';

export default function TabsLayout() {
  return <TabsLayoutInner />;
}

function TabsLayoutInner() {
  const { unreadCount } = useDeliveryNotifications();
  const badge =
    unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          paddingBottom: Platform.OS === 'ios' ? 16 : 10,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 82 : 66,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        headerStyle: {
          backgroundColor: '#fff',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 3,
        },
        headerTintColor: '#0F172A',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerTitleAlign: 'left',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Buyurtmalar',
          tabBarLabel: 'Buyurtmalar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Xabarlar',
          tabBarLabel: 'Xabarlar',
          tabBarBadge: badge,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
