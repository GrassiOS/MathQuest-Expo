// contexts/FontContext.tsx
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { createContext, useContext, useEffect } from 'react';

const FontContext = createContext({ fontsLoaded: false });

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useFonts({
    Digitalt: require('@/assets/fonts/Digitalt.otf'),
    'Gilroy-Black': require('@/assets/fonts/Gilroy-Black.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <FontContext.Provider value={{ fontsLoaded }}>
      {children}
    </FontContext.Provider>
  );
}

export const useFontContext = () => useContext(FontContext);
