import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, usePathname, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthPage } from '../../src/components/Auth';
import { MarketplaceProvider } from '../../src/marketplace/MarketplaceContext';
import { MarketplaceModals } from '../../src/marketplace/MarketplaceModals';
import { UserMessageToastHost } from '../../src/components/UserMessageToastHost';
import { api, getMarketplaceToken, setAuthLoginPromptHandler, setSessionInvalidatedHandler } from '../../src/services/api';
import { requiresAuthForRoute } from '../../src/lib/authGate';

type LoginIntent = 'none' | 'route' | 'action';

export default function TabsLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginIntent, setLoginIntent] = useState<LoginIntent>('none');
  const pathname = usePathname();
  const segments = useSegments();

  const requiresAuthRoute = requiresAuthForRoute(pathname, segments as string[]);
  const showAuthOverlay = !isAuthenticated && loginIntent !== 'none';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getMarketplaceToken();
      if (!token) {
        if (!cancelled) setIsAuthenticated(false);
        return;
      }
      try {
        await api.auth.getProfile();
        if (!cancelled) setIsAuthenticated(true);
      } catch {
        await AsyncStorage.removeItem('token');
        if (typeof localStorage !== 'undefined') localStorage.removeItem('token');
        if (!cancelled) setIsAuthenticated(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSessionInvalidatedHandler(() => {
      setIsAuthenticated(false);
      setLoginIntent('none');
    });
    setAuthLoginPromptHandler(() => {
      setLoginIntent('action');
    });
    return () => {
      setSessionInvalidatedHandler(null);
      setAuthLoginPromptHandler(null);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setLoginIntent('none');
      return;
    }
    if (requiresAuthRoute) {
      setLoginIntent('route');
      return;
    }
    setLoginIntent((prev) => (prev === 'action' ? 'action' : 'none'));
  }, [requiresAuthRoute, isAuthenticated]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
    setIsAuthenticated(false);
    setLoginIntent('none');
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setLoginIntent('none');
  };

  return (
    <MarketplaceProvider onLogout={handleLogout}>
      <View className="flex-1">
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <MarketplaceModals />
        {showAuthOverlay ? (
          <View style={StyleSheet.absoluteFillObject} className="z-[200] bg-white">
            <AuthPage onAuthSuccess={handleAuthSuccess} />
          </View>
        ) : null}
        <UserMessageToastHost />
      </View>
    </MarketplaceProvider>
  );
}
