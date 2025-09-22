
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Digitalt': require('../assets/fonts/Digitalt.otf'),
    'Gilroy-Black': require('../assets/fonts/Gilroy-Black.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="matchmaking-screen" 
        options={{ 
          presentation: 'fullScreenModal',
          gestureEnabled: false,
          animation: 'slide_from_bottom'
        }} 
      />
      <Stack.Screen 
        name="roulette-screen" 
        options={{ 
          presentation: 'fullScreenModal',
          gestureEnabled: false,
          animation: 'slide_from_right'
        }} 
      />
      <Stack.Screen 
        name="quiz-screen" 
        options={{ 
          presentation: 'fullScreenModal',
          gestureEnabled: false,
          animation: 'slide_from_right'
        }} 
      />
    </Stack>
  );
}
