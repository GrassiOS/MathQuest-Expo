import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Animated, GestureResponderEvent, Image, Pressable, StyleSheet, Text, View } from 'react-native';

type GameModeButtonProps = {
  name: string;
  route: string;
  imagePath?: any; // require('path/to/image') or { uri }
  gradientColors: [string, string, ...string[]]; // at least two colors
  onPress: (e: GestureResponderEvent) => void;
};

export const GameModeButton: React.FC<GameModeButtonProps> = ({
  name,
  route,
  imagePath,
  gradientColors,
  onPress,
}) => {
  const pressAnim = useRef(new Animated.Value(0)).current; // 0 idle, 1 pressed

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  };

  const handlePress = (e: GestureResponderEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(e);
  };

  const scale = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] });
  const shadowOpacity = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] });
  const elevation = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 8] });
  const translateY = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2] });

  const darkerColor = (hex: string, factor: number = 0.35) => {
    const normalized = hex.replace('#', '');
    if (normalized.length !== 6) return 'rgba(0,0,0,0.35)';
    const r = parseInt(normalized.substring(0, 2), 16);
    const g = parseInt(normalized.substring(2, 4), 16);
    const b = parseInt(normalized.substring(4, 6), 16);
    const d = (c: number) => Math.max(Math.min(Math.floor(c * (1 - factor)), 255), 0);
    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return `#${toHex(d(r))}${toHex(d(g))}${toHex(d(b))}`;
  };
  const baseColor = darkerColor(gradientColors[gradientColors.length - 1]);

  return (
    <Animated.View style={[
      styles.shadowWrap,
      { transform: [{ scale }], shadowOpacity: shadowOpacity as any, elevation: elevation as any },
    ]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={styles.pressable}
      >
        <View style={[styles.buttonOuter, { borderRadius: 32 }]}> 
          <View style={[styles.buttonBase, { backgroundColor: baseColor }]} />
          <Animated.View style={[styles.buttonLifted, { transform: [{ translateY }] }]}> 
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.button, { borderRadius: 32 }]}
            >
              <View pointerEvents="none" style={styles.innerStroke} />
              <View style={styles.leftIconWrap}>
                <View style={styles.wheelMask}>
                  {imagePath ? (
                    <Image source={imagePath} style={styles.wheelImage} resizeMode="cover" />
                  ) : null}
                </View>
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.buttonText}>{name}</Text>
              </View>
              <View style={styles.rightSpacer} />
            </LinearGradient>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shadowWrap: {
  width: '100%',
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08, // ↓ softer shadow
  shadowRadius: 3,
},
  pressable: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
  },
  buttonOuter: {
    height: 100,
    width: '100%',
    position: 'relative',
  },
  buttonBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0, // leave bottom lip visible
    borderRadius: 32,
  },
  buttonLifted: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0, // reveal base as 3D shadow/lip
  },
  button: {
    height: 92, // slightly taller
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    width: '100%',
  },
  innerStroke: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: 2,
    bottom: 2,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  leftIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    position: 'relative',
    marginLeft: -10, // tuck into the rounded left edge
    transform: [{ translateY: 6 }], // clip slightly into bottom edge
  },
  wheelMask: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
  },
  wheelImage: {
    width: '100%',
    height: '100%',
  },
  textWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    // Digitalt font if available in parent screen
    fontFamily: 'Digitalt',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  rightSpacer: {
    width: 64,
    height: 64,
  },
});

export default GameModeButton;


