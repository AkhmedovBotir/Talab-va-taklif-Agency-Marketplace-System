// Tabs Layout
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationUnreadProvider, useNotificationUnread } from '../../contexts/NotificationUnreadContext';

function TabsLayoutInner() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotificationUnread();
  const isWeb = Platform.OS === 'web';

  const screenOptions = useMemo(() => {
    const base = {
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: '#999',
      headerShown: true,
    };

    if (!isWeb) return base;

    const contentMax = Math.min(960, Math.max(320, width - 24));
    const barTarget = Math.min(720, Math.max(300, width - 32));
    const sideInset = Math.max(12, (width - barTarget) / 2);
    const useBeside = width >= 700;
    const bottomGap = Math.max(10, insets.bottom > 0 ? insets.bottom : 12);
    const tabBarBlock = (useBeside ? 52 : 62) + bottomGap + 16;

    return {
      ...base,
      sceneStyle: {
        maxWidth: contentMax,
        width: '100%' as const,
        alignSelf: 'center' as const,
        flex: 1,
        backgroundColor: '#f2f2f7',
        paddingBottom: tabBarBlock,
      },
      tabBarStyle: {
        position: 'absolute' as const,
        left: sideInset,
        right: sideInset,
        bottom: bottomGap,
        borderRadius: 16,
        borderTopWidth: 0,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#d1d1d6',
        backgroundColor: '#ffffff',
        paddingTop: useBeside ? 6 : 8,
        paddingBottom: useBeside ? 6 : 8,
        minHeight: useBeside ? 50 : 56,
        height: undefined,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 16,
      },
      tabBarLabelPosition: useBeside ? ('beside-icon' as const) : ('below-icon' as const),
      tabBarItemStyle: {
        flex: 1,
        justifyContent: 'center' as const,
        paddingVertical: 4,
        borderRadius: 12,
      },
      tabBarLabelStyle: {
        fontSize: useBeside ? 13 : 11,
        fontWeight: '600' as const,
        marginLeft: useBeside ? 0 : undefined,
      },
    };
  }, [isWeb, width, insets.bottom]);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="orders"
        options={{
          headerShown: false,
          title: 'Buyurtmalar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders-history"
        options={{
          headerShown: false,
          title: 'Tarix',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          headerShown: false,
          title: 'Analitika',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Habarlar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          headerShown: false,
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
    </Tabs>
  );
}

export default function TabsLayout() {
  return (
    <NotificationUnreadProvider>
      <TabsLayoutInner />
    </NotificationUnreadProvider>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
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
