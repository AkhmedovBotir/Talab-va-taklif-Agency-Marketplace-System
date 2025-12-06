import { Stack } from 'expo-router';

export default function BookmarksLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#111827',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Saqlanganlar',
          headerShown: false,
        }}
      />
    </Stack>
  );
}


