import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SnackbarProvider, useSnackbar } from "../components/AppSnackbar";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { subscribeAuthUnauthorized } from "../services/authSessionEvents";

/** Kirish talab qilinmaydigan marshrutlar */
const PUBLIC_ROOTS = new Set(["login", "password-setup"]);

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { show: showSnackbar } = useSnackbar();

  useEffect(() => {
    return subscribeAuthUnauthorized((message) => {
      showSnackbar(message || "Sessiya tugadi. Qaytadan kiring.", {
        title: "Chiqildi",
        variant: "error",
      });
    });
  }, [showSnackbar]);

  useEffect(() => {
    if (isLoading) return;

    const root = segments[0];
    const inProtectedArea = root === "(tabs)";

    if (!isAuthenticated && inProtectedArea) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && root && PUBLIC_ROOTS.has(root)) {
      router.replace("/(tabs)/");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="password-setup" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <SnackbarProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </SnackbarProvider>
    </SafeAreaProvider>
  );
}
