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
          title: 'Vakansiyalar',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Vakansiya',
        }}
      />
      <Stack.Screen
        name="[id]/apply"
        options={{
          title: 'Topshirish',
        }}
      />
    </Stack>
  );
}

