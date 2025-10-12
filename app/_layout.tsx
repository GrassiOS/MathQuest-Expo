
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AvatarProvider } from '@/contexts/AvatarContext';
import { GameProvider } from '@/contexts/GameContext';
import { OfflineStorageProvider } from '@/contexts/OfflineStorageContext';

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
    <AvatarProvider>
      <GameProvider>
        <OfflineStorageProvider>
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
        <Stack.Screen 
          name="avatar-customization-screen" 
          options={{ 
            presentation: 'modal',
            gestureEnabled: true,
            animation: 'slide_from_bottom'
          }} 
        />
        <Stack.Screen 
          name="game-results-screen" 
          options={{ 
            presentation: 'fullScreenModal',
            gestureEnabled: false,
            animation: 'fade'
          }} 
        />
        <Stack.Screen 
          name="online-game" 
          options={{ 
            presentation: 'fullScreenModal',
            gestureEnabled: false,
            animation: 'slide_from_bottom'
          }} 
        />
        <Stack.Screen 
          name="infinite-game" 
          options={{ 
            presentation: 'fullScreenModal',
            gestureEnabled: false,
            animation: 'slide_from_right'
          }} 
        />
          </Stack>
        </OfflineStorageProvider>
      </GameProvider>
    </AvatarProvider>
  );
}
