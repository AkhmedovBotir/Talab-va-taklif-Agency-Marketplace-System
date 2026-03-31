import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../contexts/AuthContext";
import { SnackbarProvider } from "../contexts/SnackbarContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SnackbarProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </SnackbarProvider>
    </AuthProvider>
  );
}
