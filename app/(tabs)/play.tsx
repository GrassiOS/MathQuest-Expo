import { FontAwesome5 } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LayeredAvatar } from '@/components/LayeredAvatar';
import AnimatedMathBackground from '@/components/ui/AnimatedMathBackground';
import GameModeButton from '@/components/ui/GameModeButton';
import { useAvatar } from '@/contexts/AvatarContext';

const { height } = Dimensions.get('window');

const USER_1 = {
  name: 'GRASSYOG',
  score: 1,
  avatar: 'G',
};

export default function PlayScreen() {
  const [fontsLoaded] = useFonts({
    Digitalt: require('../../assets/fonts/Digitalt.otf'),
    'Gilroy-Black': require('../../assets/fonts/Gilroy-Black.ttf'),
  });

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
          {/*
          <GameModeButton
            name="ONLINE!"
            route="/online-game"
            gradientColors={["#FFA65A", "#FF5EA3"]}
            imagePath={require('../../assets/images/competitive/1v1_roulette.png')}
            onPress={() => router.push('/online-game')}
          />
          <GameModeButton
            name="AVENTURA!"
            route="/infinite-game"
            gradientColors={["#8EF06E", "#31C45A"]}
            imagePath={require('../../assets/images/competitive/1v1_roulette.png')}
            onPress={() => router.push('/infinite-game')}
          />
          */}
          <GameModeButton
            name="INFINITO!"
            route="/infinite-game"
            gradientColors={["#6CCBFF", "#5B9FED"]}
            imagePath={require('../../assets/images/competitive/1v1_roulette.png')}
            onPress={() => router.push('/infinite-game')}
          />
        </View>
      </SafeAreaView>
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
});
