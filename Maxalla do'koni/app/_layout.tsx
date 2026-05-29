import { Stack, useSegments } from "expo-router";
import React from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { AuthProvider } from "../contexts/AuthContext";
import { NotificationsProvider } from "../contexts/NotificationsContext";
import { ServiceAccessProvider } from "../contexts/ServiceAccessContext";
import { isAuthRouteSegment } from "../utils/authLayout";
import { useAuthResponsiveStyles } from "../utils/useAuthResponsiveStyles";

function WebRootShell({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const isAuthRoute = isAuthRouteSegment(segments as string[]);
  const { width } = useWindowDimensions();
  const responsive = useAuthResponsiveStyles();
  const isNarrowWeb = width < 480;

  return (
    <View style={styles.webContainer}>
      <View
        style={[
          styles.webInner,
          isAuthRoute && styles.webInnerAuth,
          isAuthRoute && responsive.webShellPadding,
          isAuthRoute && isNarrowWeb && styles.webInnerAuthNarrow,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export default function RootLayout() {
  const content = <Stack screenOptions={{ headerShown: false }} />;

  return (
    <AuthProvider>
      <ServiceAccessProvider>
        <NotificationsProvider>
          {Platform.OS === "web" ? (
            <WebRootShell>{content}</WebRootShell>
          ) : (
            content
          )}
        </NotificationsProvider>
      </ServiceAccessProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f5f7fa",
    ...(Platform.OS === "web"
      ? ({
          minHeight: "100vh",
          width: "100%",
        } as object)
      : null),
  },
  webInner: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
  },
  webInnerAuth: {
    maxWidth: 560,
  },
  webInnerAuthNarrow: {
    maxWidth: "100%",
  },
});
