import { Stack } from 'expo-router';

export default function GamesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'fullScreenModal',
        animation: 'slide_from_right',
      }}
    />
  );
}
