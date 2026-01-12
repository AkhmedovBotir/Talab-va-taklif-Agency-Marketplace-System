import { Stack } from "expo-router";
import { DeliveryProviderAuthProvider } from "../contexts/DeliveryProviderAuthContext";

export default function RootLayout() {
  return (
    <DeliveryProviderAuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </DeliveryProviderAuthProvider>
  );
}
