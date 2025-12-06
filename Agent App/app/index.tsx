import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
    } else {
      router.replace("/(tabs)/orders");
    }
  }, [isAuthenticated, isLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
