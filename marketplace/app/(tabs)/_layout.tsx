import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthPage } from '../../src/components/Auth';
import { MarketplaceProvider } from '../../src/marketplace/MarketplaceContext';
import { MarketplaceModals } from '../../src/marketplace/MarketplaceModals';
import { setAuthFailureHandler } from '../../src/services/api';

export default function TabsLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthenticated(!!token);
    })();
  }, []);

  useEffect(() => {
    setAuthFailureHandler(() => {
      setIsAuthenticated(false);
    });
    return () => setAuthFailureHandler(null);
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={() => setIsAuthenticated(true)} />;
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
