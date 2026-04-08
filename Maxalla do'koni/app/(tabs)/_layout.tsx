import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        sceneStyle: {
          paddingBottom: isWeb ? 96 : 0,
        },
        tabBarShowLabel: !isWeb,
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
            : null),
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
