import { setUnauthorizedHandler, clearUnauthorizedHandler } from "../services/api";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
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
  const content = (
    <>
      <UnauthorizedHandler />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );

  return (
    <SnackbarProvider>
      <DeliveryProviderAuthProvider>
        <DeliveryNotificationsProvider>
          {Platform.OS === "web" ? (
            <View style={styles.webContainer}>
              <View style={styles.webInner}>{content}</View>
            </View>
          ) : (
            content
          )}
        </DeliveryNotificationsProvider>
      </DeliveryProviderAuthProvider>
    </SnackbarProvider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  webInner: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
  },
});
