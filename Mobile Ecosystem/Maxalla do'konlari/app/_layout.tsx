import { Stack } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { AuthProvider } from "../contexts/AuthContext";

export default function RootLayout() {
  const content = (
    <Stack screenOptions={{ headerShown: false }} />
  );

  return (
    <AuthProvider>
      {Platform.OS === "web" ? (
        <View style={styles.webContainer}>
          <View style={styles.webInner}>{content}</View>
        </View>
      ) : (
        content
      )}
    </AuthProvider>
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
