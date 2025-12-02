import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SelectedCategory = { id: string; name: string; emoji: string; color: string } | null | undefined;

type Face = {
  username: string;
  avatarComponent: React.ReactNode;
  score?: number;
  roundsWon?: number;
};

type Props = {
  selectedCategory?: SelectedCategory;
  onSpinComplete?: () => void;
  me?: Face;
  opponent?: Face;
};

const wheelImage: ImageSourcePropType = require('@/assets/images/competitive/roulette-2.png');

// Order of slices clockwise (matching the wheel artwork); 6 slices @ 60°.
// Index 0 corresponds to angle center at 30° when rotation = 0 and pointer at bottom.
const CLOCKWISE_SLICE_IDS: string[] = [
  'division',        // top (yellow)
  'totalin',         // purple swirl
  'sumas',           // green +
  'restas',          // blue -
  'multiplicacion',  // red ×
];

export default function RouletteView({ selectedCategory, onSpinComplete, me, opponent }: Props) {
  const rotateDeg = useRef(new Animated.Value(0)).current; // degrees
  const insets = useSafeAreaInsets();
  const [landedId, setLandedId] = useState<string | undefined>(selectedCategory?.id);
  const SLICE_COUNT = CLOCKWISE_SLICE_IDS.length;
  const SEGMENT_ANGLE = 360 / SLICE_COUNT; // 60

  // Helpers based on roulette-screen.tsx
  const indexForCategory = (id?: string) => {
    if (!id) return 0;
    const canonical = id.toLowerCase();
    const aliasMap: Record<string, string> = { random: 'totalin', aleatorio: 'totalin' };
    const normalized = aliasMap[canonical] || canonical;
    const idx = CLOCKWISE_SLICE_IDS.findIndex(s => s === normalized);
    return Math.max(0, idx === -1 ? 0 : idx);
  };
  
  const angleForIndex = (idx: number) => {
  // Pointer is at top → rotate so that slice centers align correctly.
  // Each slice = 60°, offset so index 0 (division) starts centered at 0° (top)
  const SLICE_OFFSET = 30; // adjust if pointer not exactly centered on top
  return 360 - (idx * SEGMENT_ANGLE) - SLICE_OFFSET;
};

const computeLandedIndex = (angle: number) => {
  // Normalize angle to 0–359
  const a = ((angle % 360) + 360) % 360;
  // Reverse math from angleForIndex, accounting for offset
  const SLICE_OFFSET = 30;
  const adjusted = (360 - a - SLICE_OFFSET + SEGMENT_ANGLE / 2);
  const idx = Math.floor(adjusted / SEGMENT_ANGLE) % SLICE_COUNT;
  return (idx + SLICE_COUNT) % SLICE_COUNT;
};


  // Compute target angle using the same math as roulette-screen.tsx
  const targetAngle = useMemo(() => {
    const idx = indexForCategory(selectedCategory?.id);
    return angleForIndex(idx);
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
      }).start(() => {
        // Determine landed slice using the inverse of the target angle formula
        const landedIdx = computeLandedIndex(final);
        const id = CLOCKWISE_SLICE_IDS[landedIdx];
        setLandedId(id);
        onSpinComplete?.();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [targetAngle]);

  const rotation = rotateDeg.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      {/* Header with avatars and score */}
      {(me || opponent) && (
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
          {/* Left player */}
          <View style={styles.playerCol}>
            <View style={styles.avatarCircle}>{me?.avatarComponent}</View>
            <Text style={[styles.scoreText, { fontFamily: 'Digitalt' }]}>{String(me?.score ?? 0).padStart(2, '0')}</Text>
            <Text style={[styles.usernameText, { fontFamily: 'Digitalt' }]} numberOfLines={1}>
              {me?.username?.toUpperCase() || 'TU'}
            </Text>
            <Text style={[styles.roundsText, { fontFamily: 'Digitalt' }]}>🏆 {String(me?.roundsWon ?? 0)}</Text>
          </View>
          {/* Right player */}
          <View style={styles.playerCol}>
            <View style={styles.avatarCircle}>{opponent?.avatarComponent}</View>
            <Text style={[styles.scoreText, { fontFamily: 'Digitalt' }]}>{String(opponent?.score ?? 0).padStart(2, '0')}</Text>
            <Text style={[styles.usernameText, { fontFamily: 'Digitalt' }]} numberOfLines={1}>
              {opponent?.username?.toUpperCase() || 'OPONENTE'}
            </Text>
            <Text style={[styles.roundsText, { fontFamily: 'Digitalt' }]}>🏆 {String(opponent?.roundsWon ?? 0)}</Text>
          </View>
        </View>
      )}

      <View style={styles.wheelContainer}>
        <View style={styles.pointer} />
        <Animated.View style={[styles.wheelWrap, { transform: [{ rotate: rotation }] }]}>
          <Image source={wheelImage} style={styles.wheel} resizeMode="contain" />
        </Animated.View>
      </View>
      {/* Center circle */}
      <View style={styles.centerCircle} />
      {selectedCategory || landedId ? (
        <View style={styles.labelWrap}>
          <Text style={[styles.labelText, { fontFamily: 'Digitalt' }]}>CATEGORÍA</Text>
          <Text style={[
            styles.labelName,
            { fontFamily: 'Digitalt', color: selectedCategory?.color || '#FFFFFF' }
          ]}>
            {selectedCategory?.emoji || '🎯'} {(selectedCategory?.name || landedId || '').toString().toUpperCase()}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 112,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  playerCol: { alignItems: 'center', gap: 6 },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scoreText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: 6, letterSpacing: 1 },
  usernameText: { color: '#FFFFFF', opacity: 0.85, fontSize: 10, letterSpacing: 0.8, maxWidth: 120 },
  wheelContainer: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center' },
  pointer: {
    position: 'absolute',
    top: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
    zIndex: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  wheelWrap: { width: 300, height: 300 },
  wheel: { width: '100%', height: '100%' },
  centerCircle: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EED0D7',
    borderWidth: 3,
    borderColor: '#000000',
    elevation: 10,
  },
  labelWrap: { position: 'absolute', bottom: 80, alignItems: 'center' },
  labelText: { color: '#FFFFFF', opacity: 0.85, fontSize: 14, letterSpacing: 1 },
  labelName: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
  roundsText: { color: '#FFD45E', fontSize: 11, marginTop: 2 },
});


