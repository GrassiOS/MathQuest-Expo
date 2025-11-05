import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

type SelectedCategory = { id: string; name: string; emoji: string; color: string } | null | undefined;

type Props = {
  selectedCategory?: SelectedCategory;
  onSpinComplete?: () => void;
};

const wheelImage: ImageSourcePropType = require('@/assets/images/competitive/1v1_roulette.png');

// Fallback angles (deg) for each known category id, tuned to a 6-slice wheel.
// These can be refined to match the final artwork exactly.
const CATEGORY_TO_ANGLE: Record<string, number> = {
  division: 30,           // yellow ➗
  totalin: 90,            // purple spiral 🎯/random
  sumas: 150,             // green ➕
  restas: 210,            // blue ➖
  multiplicacion: 270,    // red ✖️
};

export default function RouletteView({ selectedCategory, onSpinComplete }: Props) {
  const rotateDeg = useRef(new Animated.Value(0)).current; // degrees

  // Compute target angle for the incoming category; default to 330 if unknown
  const targetAngle = useMemo(() => {
    if (!selectedCategory?.id) return 330;
    return CATEGORY_TO_ANGLE[selectedCategory.id] ?? 330;
  }, [selectedCategory?.id]);

  useEffect(() => {
    // Start the spin 3s after the view mounts
    const timer = setTimeout(() => {
      const baseSpins = 5; // full rotations
      const final = baseSpins * 360 + targetAngle;
      Animated.timing(rotateDeg, {
        toValue: final,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => onSpinComplete?.());
    }, 3000);

    return () => clearTimeout(timer);
  }, [targetAngle]);

  const rotation = rotateDeg.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <View style={styles.pointer} />
      <Animated.View style={[styles.wheelWrap, { transform: [{ rotate: rotation }] }]}> 
        <Image source={wheelImage} style={styles.wheel} resizeMode="contain" />
      </Animated.View>
      {selectedCategory ? (
        <View style={styles.labelWrap}>
          <Text style={[styles.labelText, { fontFamily: 'Digitalt' }]}>CATEGORÍA</Text>
          <Text style={[styles.labelName, { fontFamily: 'Digitalt', color: selectedCategory.color }]}>
            {selectedCategory.emoji} {selectedCategory.name.toUpperCase()}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wheelWrap: { width: 300, height: 300 },
  wheel: { width: '100%', height: '100%' },
  pointer: {
    position: 'absolute',
    top: '12%',
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFD45E',
    zIndex: 5,
  },
  labelWrap: { position: 'absolute', bottom: 80, alignItems: 'center' },
  labelText: { color: '#FFFFFF', opacity: 0.85, fontSize: 14, letterSpacing: 1 },
  labelName: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
});


