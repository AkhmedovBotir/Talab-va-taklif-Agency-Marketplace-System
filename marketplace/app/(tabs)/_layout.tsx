import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, usePathname, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthPage } from '../../src/components/Auth';
import { MarketplaceProvider } from '../../src/marketplace/MarketplaceContext';
import { MarketplaceModals } from '../../src/marketplace/MarketplaceModals';
import { api, setAuthFailureHandler } from '../../src/services/api';

export default function TabsLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [isValidatingSession, setIsValidatingSession] = useState(false);
  const pathname = usePathname();
  const segments = useSegments();

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    })();
  }, []);

  useEffect(() => {
    setAuthFailureHandler(() => {
      setIsAuthenticated(false);
      setAuthRequired(true);
    });
    return () => setAuthFailureHandler(null);
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
    setIsAuthenticated(false);
    setAuthRequired(false);
  };

  /** Expo Router pathname ba'zan guruh prefikslarsiz/ boshqacha bo‘lishi mumkin — segmentlar ishonchliroq. */
  const meaningful = segments.filter((s) => typeof s === 'string' && !s.startsWith('('));
  const lastSeg = meaningful[meaningful.length - 1] ?? '';
  const prevSeg = meaningful[meaningful.length - 2] ?? '';
  const pathAuth =
    /(^|\/)(profile|cart|checkout|partner-requests)(\/?|$)/.test(pathname) || /(^|\/)orders(\/|$)/.test(pathname);
  const segmentAuth =
    lastSeg === 'profile' ||
    lastSeg === 'cart' ||
    lastSeg === 'checkout' ||
    lastSeg === 'partner-requests' ||
    lastSeg === 'orders' ||
    prevSeg === 'orders';
  const requiresAuthRoute = pathAuth || segmentAuth;

  useEffect(() => {
    let cancelled = false;
    const validateSession = async () => {
      if (!requiresAuthRoute || !isAuthenticated) return;
      setIsValidatingSession(true);
      try {
        await api.auth.getProfile();
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setAuthRequired(true);
        }
      } finally {
        if (!cancelled) setIsValidatingSession(false);
      }
    };
    void validateSession();
    return () => {
      cancelled = true;
    };
  }, [requiresAuthRoute, isAuthenticated, pathname]);

  if (isAuthenticated === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (!isAuthenticated && (authRequired || requiresAuthRoute)) {
    return (
      <AuthPage
        onAuthSuccess={() => {
          setIsAuthenticated(true);
          setAuthRequired(false);
        }}
      />
    );
  }

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
      </View>
    </MarketplaceProvider>
  );
}
