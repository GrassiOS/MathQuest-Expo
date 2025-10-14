// components/ui/AnimatedGradientBackground.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AnimatedMathBackground from './AnimatedMathBackground';

interface AnimatedGradientBackgroundProps {
  colors: string[];
  children: React.ReactNode;
  paddingHorizontal?: number;
}

export default function AnimatedGradientBackground({ colors, children, paddingHorizontal = 20 }: AnimatedGradientBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* Gradient ignores SafeArea - goes full screen */}
      <LinearGradient colors={colors as unknown as readonly [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      
      {/* Animated Math Background - also ignores SafeArea */}
      <AnimatedMathBackground />
      
      {/* Content respects SafeArea */}
      <SafeAreaView style={[styles.content, { paddingHorizontal }]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
