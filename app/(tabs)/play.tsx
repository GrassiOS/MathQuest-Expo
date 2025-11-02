import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LayeredAvatar } from '@/components/LayeredAvatar';
import AnimatedMathBackground from '@/components/ui/AnimatedMathBackground';
import GameModeButton from '@/components/ui/GameModeButton';
import { useAvatar } from '@/contexts/AvatarContext';
import { useFontContext } from '@/contexts/FontsContext';

const { height } = Dimensions.get('window');

const USER_1 = {
  name: 'GRASSYOG',
  score: 1,
  avatar: 'G',
};

export default function PlayScreen() {
  const { fontsLoaded } = useFontContext();

  const { avatar: userAvatar } = useAvatar();

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#A855F7', '#7C3AED']}
        style={styles.gradientBackground}
      />
      <AnimatedMathBackground />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        {/* Top-right avatar + coins */}
        <View style={styles.topBar}>
          <View style={styles.avatarBlock}>
            <View style={styles.avatarCircle}>
              <LayeredAvatar avatar={userAvatar} size={64} style={styles.layeredAvatar} />
            </View>
            <View style={styles.coinsRow}>
              <FontAwesome5 name="coins" size={16} color="#FFD45E" />
              <Text style={styles.coinsText}>300</Text>
            </View>
          </View>
        </View>

        {/* Center title */}
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>SELECCIONA{"\n"}MODO DE JUEGO!</Text>
        </View>



        {/* Game mode buttons */}
        <View style={styles.buttonsWrap}>

          <GameModeButton
            name="COMPETITIVO!"
            route="/(games)/matchmaking-game"
            gradientColors={["#FF6A6A", "#FF3D3D"]}
            imagePath={require('@/assets/images/competitive/1v1_roulette.png')}
            onPress={() => router.push('/(games)/matchmaking-screen')}
          />
        </View>
      </SafeAreaView>
      {/* Floating Leaderboard button to new screen */}
      <Link href="/(games)/leaderboard" asChild>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            console.log('Leaderboard button pressed (play tab)');
          }}
        >
          <LinearGradient colors={["#FFD45E", "#FFA500"]} style={styles.fabGradient}>
            <FontAwesome5 name="trophy" size={18} color="#fff" />
            <Text style={styles.fabText}>Tabla</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  safeArea: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  layeredAvatar: {
    borderRadius: 34,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  avatarBlock: {
    alignItems: 'center',
    gap: 8,
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  coinsText: {
    color: '#FFD45E',
    fontWeight: 'bold',
  },
  titleWrap: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  buttonsWrap: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 22,
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 120,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
  },
});
