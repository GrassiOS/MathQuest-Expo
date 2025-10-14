import { useAuth } from '@/contexts/AuthContext';
import { useFonts } from 'expo-font';
import { router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const segments = useSegments();

  const [fontsLoaded] = useFonts({
    Digitalt: require('../assets/fonts/Digitalt.otf'),
    'Gilroy-Black': require('../assets/fonts/Gilroy-Black.ttf'),
  });

  useEffect(() => {
    if (loading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'matchmaking-screen' || segments[0] === 'roulette-screen' || segments[0] === 'quiz-screen' || segments[0] === 'avatar-customization-screen' || segments[0] === 'game-results-screen' || segments[0] === 'online-game' || segments[0] === 'infinite-game' || segments[0] === 'lobby-screen' || segments[0] === 'online-game-screen' || segments[0] === 'round-result-screen' || segments[0] === 'match-end-screen';

    if (!user && inAuthGroup) {
      // User is not authenticated but trying to access protected route
      router.replace('/login' as any);
    } else if (user && !inAuthGroup && segments[0] !== 'login' && segments[0] !== 'signup' && segments[0] !== 'forgot-password') {
      // User is authenticated but on auth screen (except for auth pages)
      router.replace('/(tabs)' as any);
    }
  }, [user, loading, segments, fontsLoaded]);

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { fontFamily: 'Digitalt' }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AuthGuard;
