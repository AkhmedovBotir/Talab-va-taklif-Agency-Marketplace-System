import { setUnauthorizedHandler, clearUnauthorizedHandler } from "../services/api";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { DeliveryProviderAuthProvider, useDeliveryProviderAuth } from "../contexts/DeliveryProviderAuthContext";
import { DeliveryNotificationsProvider } from "../contexts/DeliveryNotificationsContext";
import { SnackbarProvider } from "../components/SnackbarProvider";

function UnauthorizedHandler() {
  const { logout } = useDeliveryProviderAuth();
  const router = useRouter();

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await logout();
      router.replace("/login");
    });
    return () => clearUnauthorizedHandler();
  }, [logout, router]);

  return null;
}

export default function RootLayout() {
  return (
    <SnackbarProvider>
      <DeliveryProviderAuthProvider>
        <DeliveryNotificationsProvider>
          <UnauthorizedHandler />
          <Stack screenOptions={{ headerShown: false }} />
        </DeliveryNotificationsProvider>
      </DeliveryProviderAuthProvider>
    </SnackbarProvider>
  );
}
