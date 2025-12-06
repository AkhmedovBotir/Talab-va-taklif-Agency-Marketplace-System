import { Stack } from "expo-router";
import { AuthProvider } from "./contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="kpi" />
      </Stack>
    </AuthProvider>
  );
}
