import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthNavigationGuard } from "../components/AuthNavigationGuard";
import { AuthProvider } from "../contexts/AuthContext";
import { SnackbarProvider } from "../contexts/SnackbarContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SnackbarProvider>
        <AuthNavigationGuard>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </AuthNavigationGuard>
      </SnackbarProvider>
    </AuthProvider>
  );
}
