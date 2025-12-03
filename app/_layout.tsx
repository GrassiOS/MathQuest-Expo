import AuthGuard from '@/components/AuthGuard';
import { AuthProvider } from '@/contexts/AuthContext';
import { AvatarProvider } from '@/contexts/AvatarContext';
import { FontProvider } from '@/contexts/FontsContext';
import { GameProvider } from '@/contexts/GameContext';
import { OfflineStorageProvider } from '@/contexts/OfflineStorageContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

// Keep the native splash up until our React overlay is ready
void SplashScreen.preventAutoHideAsync();

const SPLASH_PURPLE = '#7B4DFF';
let didShowAnimatedSplash = false;

export default function RootLayout() {
  useFrameworkReady();
  const [showSplash, setShowSplash] = useState(() => !didShowAnimatedSplash);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  // As soon as our overlay is mounted, hide the native splash for a seamless handoff
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (!showSplash) return;
    const timeoutId = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        didShowAnimatedSplash = true;
        setShowSplash(false);
      });
    }, 4000);

    return () => clearTimeout(timeoutId);
  }, [showSplash, splashOpacity]);

  return (
    <FontProvider>
      <AuthProvider>
        <AuthGuard>
          <AvatarProvider>
            <GameProvider>
              <OfflineStorageProvider>
                <>
                  <Slot />
                  {showSplash && (
                    <Animated.View style={[StyleSheet.absoluteFill, styles.splashOverlay, { opacity: splashOpacity }]}>
                      <LottieView
                        source={require('../assets/lotties/extras/Splash.json')}
                        autoPlay
                        loop={false}
                        style={styles.lottie}
                        onAnimationFinish={() => {
                          Animated.timing(splashOpacity, {
                            toValue: 0,
                            duration: 400,
                            useNativeDriver: true,
                          }).start(() => {
                            didShowAnimatedSplash = true;
                            setShowSplash(false);
                          });
                        }}
                      />
                    </Animated.View>
                  )}
                </>
              </OfflineStorageProvider>
            </GameProvider>
          </AvatarProvider>
        </AuthGuard>
      </AuthProvider>
    </FontProvider>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPLASH_PURPLE,
  },
  lottie: {
    width: 420,
    height: 420,
  },
});
