import { useAuth } from '@/contexts/AuthContext';
import { useFontContext } from '@/contexts/FontsContext';
import { router, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const { fontsLoaded } = useFontContext();
  const segments = useSegments();

  useEffect(() => {
    if (loading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === '(games)' || segments[0] === '(modals)';
    const isAuthPage = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'forgot-password' || segments[0] === '(auth)';

    if (!user && inAuthGroup) {
      // User is not authenticated but trying to access protected route
      router.replace('/login' as any);
    } else if (user && !inAuthGroup && !isAuthPage) {
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
