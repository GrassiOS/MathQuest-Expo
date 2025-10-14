// components/ui/GradientBackground.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GradientBackgroundProps {
  colors: string[];
  children: React.ReactNode;
}

export default function GradientBackground({ colors, children }: GradientBackgroundProps) {
  return (
    <View style={styles.outer}>
      {/* Make sure status bar overlays */}
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Fullscreen gradient ignoring safe area */}
      <LinearGradient
        colors={colors as [string, string]}
        style={StyleSheet.absoluteFill}
      />

      {/* Safe content */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});