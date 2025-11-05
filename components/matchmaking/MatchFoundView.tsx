import { FadeInView } from '@/components/shared/FadeInView';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { height } = Dimensions.get('window');

type Face = { username: string; avatarComponent: React.ReactNode };

type Props = {
  me: Face;
  opponent: Face;
  isExiting?: boolean;
  onExitComplete?: () => void;
};

export default function MatchFoundView({ me, opponent, isExiting = false, onExitComplete }: Props) {
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isExiting) {
      Animated.timing(fade, { toValue: 0, duration: 600, useNativeDriver: true }).start(({ finished }) => {
        if (finished) onExitComplete?.();
      });
    } else {
      fade.setValue(1);
    }
  }, [isExiting]);

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      {/* Top Gradient Section */}
      <LinearGradient colors={["#9C58FE", "#6F52FD"]} style={styles.topHalf}>
        <View style={styles.contentContainer}>
          {/* Title */}
          <FadeInView delay={50} duration={500} from="top" style={styles.titleContainer}>
            <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>PARTIDA</Text>
            <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>ENCONTRADA!</Text>
          </FadeInView>

          {/* User Avatar */}
          <FadeInView delay={150} duration={550} from="none" style={styles.avatarBlock}>
            <View style={styles.avatarCircle}>{me.avatarComponent}</View>
            <Text style={[styles.username, { fontFamily: 'Digitalt' }]} numberOfLines={1}>
              {me.username.toUpperCase()}
            </Text>
          </FadeInView>

          {/* VS Bar (full width again) */}
          <FadeInView delay={300} duration={500} from="bottom" distance={40} style={styles.vsBar}>
            <Text style={[styles.vs, { fontFamily: 'Digitalt' }]}>VS</Text>
          </FadeInView>
        </View>
      </LinearGradient>

      {/* Red Bottom Section (ignores SafeArea) */}
      <LinearGradient colors={["#FF3D3D", "#B91C1C"]} style={styles.bottomBox}>
        <FadeInView delay={450} duration={600} from="bottom" distance={60} style={styles.opponentBlock}>
          <View style={styles.avatarCircle}>{opponent.avatarComponent}</View>
          <Text style={[styles.username, { fontFamily: 'Digitalt' }]} numberOfLines={1}>
            {opponent.username.toUpperCase()}
          </Text>
        </FadeInView>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Top Section (purple gradient)
  topHalf: { flex: 1 },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  titleContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  avatarBlock: { 
    alignItems: 'center', 
    gap: 12,
    marginBottom: 32,
  },
  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  title: { 
    color: '#FFFFFF', 
    fontSize: 32, 
    fontWeight: '900', 
    letterSpacing: 1.5, 
    textAlign: 'center',
    lineHeight: 38,
  },
  username: { 
    color: '#FFFFFF', 
    fontSize: 14, 
    fontWeight: '900', 
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // VS Bar (restored full width)
  vsBar: { 
    marginTop: 40,
    height: 56, 
    width: '100%',
    backgroundColor: '#FFFFFF', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  vs: { 
    color: '#000000', 
    fontSize: 32, 
    fontWeight: '900', 
    letterSpacing: 2.5,
  },

  // Red Bottom Section
  bottomBox: {
    width: '100%',
    height: height * 0.33,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32, // visually balances with top
  },
  opponentBlock: {
    alignItems: 'center',
    gap: 12,
  },
});
