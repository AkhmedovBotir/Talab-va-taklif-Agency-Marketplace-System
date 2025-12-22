import { Stack } from 'expo-router';

export default function VacanciesLayout() {
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
          headerShown: false,
          title: 'Vakansiyalar',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
          title: 'Vakansiya',
        }}
      />
      <Stack.Screen
        name="[id]/apply"
        options={{
          headerShown: false,
          title: 'Topshirish',
        }}
      />
    </Stack>
  );
}

