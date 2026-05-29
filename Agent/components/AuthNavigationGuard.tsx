import { useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isProtectedRoute, onUnauthorized } from '../services/authSession';

/** Himoyalangan sahifada sessiya yo‘q yoki 401 — login ga yo‘naltirish (web + native). */
export function AuthNavigationGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && isProtectedRoute(segments)) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  useEffect(() => {
    return onUnauthorized(() => {
      router.replace('/login');
    });
  }, [router]);

  return <>{children}</>;
}
