import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeliveryNotifications } from '../../contexts/DeliveryNotificationsContext';

export default function TabsLayout() {
  return <TabsLayoutInner />;
}

function TabsLayoutInner() {
  const { unreadCount } = useDeliveryNotifications();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const badge =
    unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarShowLabel: !isWeb,
        sceneStyle: {
          paddingBottom: isWeb ? 96 : 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: isWeb ? 4 : 0,
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 6,
          height: isWeb ? 72 : 60 + insets.bottom,
          backgroundColor: '#fff',
          ...(isWeb
            ? {
                position: 'absolute',
                bottom: 12,
                left: 12,
                right: 12,
                maxWidth: 760,
                alignSelf: 'center',
                borderWidth: 1,
                borderColor: '#e6e6e6',
                borderRadius: 18,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 10,
                elevation: 6,
              }
            : {
                borderTopWidth: 0,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 10,
              }),
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
            <Ionicons name="list" size={size || 24} color={color} />
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
            <Ionicons name="notifications-outline" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size || 24} color={color} />
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
