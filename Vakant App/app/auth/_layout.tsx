import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="register/index" />
      <Stack.Screen name="register/send-code" />
      <Stack.Screen name="register/form" />
      <Stack.Screen name="login/index" />
      <Stack.Screen name="login/confirm" />
      <Stack.Screen name="forgot-password/index" />
      <Stack.Screen name="forgot-password/confirm" />
    </Stack>
  );
}


