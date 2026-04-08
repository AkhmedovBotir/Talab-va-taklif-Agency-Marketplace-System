import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useContragentNotificationSocket } from '../../hooks/useContragentNotificationSocket';
import { BREAKPOINT_DESKTOP } from '../../hooks/useResponsive';
import { apiService } from '../../services/api';

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
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && windowWidth >= BREAKPOINT_DESKTOP;

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch {
      // Ignore unread count errors
    }
  }, []);

  useContragentNotificationSocket(token, fetchUnreadCount);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const webBottomInset = Math.max(insets.bottom, 14);
  const nativeBottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 10 : 6);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle:
          Platform.OS === 'web'
            ? {
                fontSize: 11,
                fontWeight: '500',
                marginTop: 2,
                marginBottom: 2,
              }
            : undefined,
        tabBarIconStyle: Platform.OS === 'web' ? { marginTop: 4 } : undefined,
        tabBarItemStyle: Platform.OS === 'web' ? { paddingVertical: 4 } : undefined,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingTop: Platform.OS === 'web' ? 8 : 5,
          paddingBottom: Platform.OS === 'web' ? webBottomInset : nativeBottomInset,
          height: Platform.OS === 'web' ? 88 + webBottomInset : 60 + insets.bottom,
          ...(Platform.OS === 'web'
            ? { overflow: 'visible' as const }
            : {}),
          ...(isWebDesktop
            ? {
                maxWidth: 640,
                width: '100%',
                alignSelf: 'center',
                marginHorizontal: 'auto',
                borderLeftWidth: 1,
                borderRightWidth: 1,
                borderBottomWidth: 0,
                borderLeftColor: '#e0e0e0',
                borderRightColor: '#e0e0e0',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                marginBottom: 0,
                paddingHorizontal: 8,
              }
            : {}),
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
        name="statistika/payments"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="statistika/payment-detail"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="statistika/finance"
        options={{
          href: null, // Hide from tab bar
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
        name="buyurtmalar/order/group"
        options={{
          href: null,
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
