import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';

export default function TabsLayout() {
  const router = useRouter();
  const { unreadCount } = useUnreadNotifications();
  const { width: windowWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  // Webda ham mobilga yaqin, ammo breakpoint bo‘yicha moslashuvchan tabbar
  const tabBarMaxWidth = isWeb
    ? Math.min(620, Math.max(windowWidth - 24, 280))
    : undefined;
  const ultraCompact = isWeb && windowWidth < 430;
  const compactTabBar = isWeb && windowWidth >= 430 && windowWidth < 760;

  const screenOptions = {
    tabBarActiveTintColor: '#007AFF',
    tabBarInactiveTintColor: '#8E8E93',
    headerShown: true,
    ...(isWeb
      ? {
          tabBarStyle: StyleSheet.flatten([
            styles.tabBarBase,
            {
              maxWidth: tabBarMaxWidth,
              width: '100%',
              alignSelf: 'center',
              height: ultraCompact ? 54 : compactTabBar ? 58 : 62,
              paddingTop: 6,
              paddingBottom: ultraCompact ? 8 : 10,
              paddingHorizontal: Math.min(20, Math.max(6, windowWidth * 0.02)),
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderTopWidth: 1,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: '#E5E5EA',
              backgroundColor: '#FFFFFF',
              ...({ boxShadow: '0 -8px 28px rgba(0,0,0,0.07)' } as object),
            },
          ]),
          tabBarLabelPosition: 'below-icon' as const,
          tabBarLabelStyle: {
            fontSize: ultraCompact ? 9 : compactTabBar ? 10 : 11,
            fontWeight: '500' as const,
            marginTop: 2,
            marginBottom: 0,
          },
          tabBarIconStyle: { marginTop: 0 },
          tabBarItemStyle: {
            paddingVertical: ultraCompact ? 2 : 4,
            minWidth: ultraCompact ? 48 : compactTabBar ? 54 : 64,
            flex: 1,
            maxWidth: ultraCompact ? undefined : compactTabBar ? 150 : 170,
          },
          tabBarShowLabel: !ultraCompact,
        }
      : {
          tabBarStyle: styles.tabBarBase,
        }),
  };

  return (
    <Tabs screenOptions={screenOptions}>
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
          title: 'Transfer buyurtmalar',
          tabBarLabel: 'Transferlar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-horizontal" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Moliya',
          tabBarLabel: 'Moliya',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
          headerShown: true,
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
  tabBarBase: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
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