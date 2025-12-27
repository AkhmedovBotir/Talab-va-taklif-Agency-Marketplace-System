import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "./contexts/AuthContext";
import { LoadingSpinner } from "./components/LoadingSpinner";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments[0];
    
    if (!isAuthenticated) {
      // Only navigate if not already on login page
      if (currentRoute !== 'auth') {
        router.replace("/(auth)/login");
      }
    } else {
      // Only navigate if not already on tabs
      if (currentRoute !== 'tabs') {
        router.replace("/(tabs)/orders");
      }
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <LoadingSpinner />;
}
