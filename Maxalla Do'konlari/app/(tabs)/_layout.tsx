import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

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
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Asosiy',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="delivery"
        options={{
          title: 'Kuryer',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bicycle" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Ombor',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Buyurtmalar',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size || 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
