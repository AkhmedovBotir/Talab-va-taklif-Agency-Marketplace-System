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

    if (!isAuthenticated) {
      router.replace("/(auth)/login");
    } else {
      router.replace("/(tabs)/orders");
    }
  }, [isAuthenticated, isLoading]);

  return <LoadingSpinner />;
}
