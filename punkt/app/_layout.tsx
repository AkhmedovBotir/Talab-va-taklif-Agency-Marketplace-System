import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./contexts/AuthContext";
import { DialogProvider } from "./contexts/DialogContext";
import { SnackbarProvider } from "./contexts/SnackbarContext";

export default function RootLayout() {
  return (
    <SnackbarProvider>
      <DialogProvider>
      <AuthProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="kpi" />
      </Stack>
      </AuthProvider>
      </DialogProvider>
    </SnackbarProvider>
  );
}
