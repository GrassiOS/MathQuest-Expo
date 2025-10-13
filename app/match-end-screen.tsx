import { FontAwesome5 } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LayeredAvatar } from '@/components/LayeredAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatar } from '@/contexts/AvatarContext';
import { MatchEndData } from '@/hooks/useWebSocket';

const { width, height } = Dimensions.get('window');

export default function MatchEndScreen() {
  const params = useLocalSearchParams();
  const matchEndDataParam = params.matchEndData as string;
  
  const [fontsLoaded] = useFonts({
    Digitalt: require('../assets/fonts/Digitalt.otf'),
    'Gilroy-Black': require('../assets/fonts/Gilroy-Black.ttf'),
  });

  const { user } = useAuth();
  const { avatar: userAvatar } = useAvatar();
  
  // Parse data from params
  const matchEndData: MatchEndData = JSON.parse(matchEndDataParam);
  
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Animation refs
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const winnerScale = useRef(new Animated.Value(0)).current;
  const loserScale = useRef(new Animated.Value(0)).current;

  const isWinner = matchEndData.winner.id === user?.id;
  const isLoser = matchEndData.loser.id === user?.id;

  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Show confetti for winner
    if (isWinner) {
      setTimeout(() => {
        setShowConfetti(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 1000);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Animate winner first
    setTimeout(() => {
      Animated.spring(winnerScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 1500);

    // Animate loser second
    setTimeout(() => {
      Animated.spring(loserScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 2000);

  }, []);

  const handlePlayAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/online-game');
  };

  const handleBackToMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/play');
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
        colors={isWinner ? ['#22c55e', '#16a34a'] : ['#ef4444', '#dc2626']}
        style={styles.gradientBackground}
      />

      {/* Confetti Animation */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          <LottieView
            source={require('../assets/lotties/extras/Confetti_quick.json')}
            autoPlay
            loop={false}
            style={styles.confettiAnimation}
          />
        </View>
      )}

      <Animated.View style={[
        styles.content,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim
        }
      ]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { fontFamily: 'Digitalt' }]}>
              {isWinner ? '¡VICTORIA!' : 'MATCH TERMINADO'}
            </Text>
            <Text style={[styles.headerSubtitle, { fontFamily: 'Gilroy-Black' }]}>
              {isWinner ? '¡Felicidades!' : 'Mejor suerte la próxima vez'}
            </Text>
          </View>

          {/* Match Results */}
          <View style={styles.resultsContainer}>
            {/* Winner */}
            <Animated.View style={[
              styles.playerResult,
              styles.winnerResult,
              { transform: [{ scale: winnerScale }] }
            ]}>
              <View style={styles.playerInfo}>
                <View style={styles.avatarContainer}>
                  <LayeredAvatar 
                    avatar={matchEndData.winner.id === user?.id ? userAvatar : matchEndData.winner.avatar}
                    size={80}
                    style={styles.avatar}
                  />
                  <View style={styles.crownIcon}>
                    <FontAwesome5 name="crown" size={24} color="#FFD700" />
                  </View>
                </View>
                <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>
                  {matchEndData.winner.username}
                </Text>
                <Text style={[styles.playerTitle, { fontFamily: 'Gilroy-Black' }]}>
                  GANADOR
                </Text>
              </View>
              
              <View style={styles.scoreContainer}>
                <View style={styles.scoreItem}>
                  <Text style={[styles.scoreLabel, { fontFamily: 'Gilroy-Black' }]}>
                    RONDAS GANADAS
                  </Text>
                  <Text style={[styles.scoreValue, { fontFamily: 'Digitalt' }]}>
                    {matchEndData.winner.roundsWon}
                  </Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={[styles.scoreLabel, { fontFamily: 'Gilroy-Black' }]}>
                    PUNTOS TOTALES
                  </Text>
                  <Text style={[styles.scoreValue, { fontFamily: 'Digitalt' }]}>
                    {matchEndData.winner.totalScore}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* VS Divider */}
            <View style={styles.vsSection}>
              <View style={styles.vsLine} />
              <View style={styles.vsCircle}>
                <Text style={[styles.vsText, { fontFamily: 'Digitalt' }]}>VS</Text>
              </View>
              <View style={styles.vsLine} />
            </View>

            {/* Loser */}
            <Animated.View style={[
              styles.playerResult,
              styles.loserResult,
              { transform: [{ scale: loserScale }] }
            ]}>
              <View style={styles.playerInfo}>
                <View style={styles.avatarContainer}>
                  <LayeredAvatar 
                    avatar={matchEndData.loser.id === user?.id ? userAvatar : matchEndData.loser.avatar}
                    size={80}
                    style={styles.avatar}
                  />
                </View>
                <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>
                  {matchEndData.loser.username}
                </Text>
                <Text style={[styles.playerTitle, { fontFamily: 'Gilroy-Black' }]}>
                  PERDEDOR
                </Text>
              </View>
              
              <View style={styles.scoreContainer}>
                <View style={styles.scoreItem}>
                  <Text style={[styles.scoreLabel, { fontFamily: 'Gilroy-Black' }]}>
                    RONDAS GANADAS
                  </Text>
                  <Text style={[styles.scoreValue, { fontFamily: 'Digitalt' }]}>
                    {matchEndData.loser.roundsWon}
                  </Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={[styles.scoreLabel, { fontFamily: 'Gilroy-Black' }]}>
                    PUNTOS TOTALES
                  </Text>
                  <Text style={[styles.scoreValue, { fontFamily: 'Digitalt' }]}>
                    {matchEndData.loser.totalScore}
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Match Stats */}
          <View style={styles.statsContainer}>
            <Text style={[styles.statsTitle, { fontFamily: 'Digitalt' }]}>
              ESTADÍSTICAS DEL MATCH
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <FontAwesome5 name="clock" size={20} color="#fff" />
                <Text style={[styles.statLabel, { fontFamily: 'Gilroy-Black' }]}>
                  Duración
                </Text>
                <Text style={[styles.statValue, { fontFamily: 'Digitalt' }]}>
                  {formatTime(matchEndData.duration)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome5 name="gamepad" size={20} color="#fff" />
                <Text style={[styles.statLabel, { fontFamily: 'Gilroy-Black' }]}>
                  Rondas
                </Text>
                <Text style={[styles.statValue, { fontFamily: 'Digitalt' }]}>
                  {matchEndData.rounds.length}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.playAgainButton}
              onPress={handlePlayAgain}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <FontAwesome5 name="redo" size={20} color="#fff" />
                <Text style={[styles.buttonText, { fontFamily: 'Digitalt' }]}>
                  JUGAR DE NUEVO
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuButton}
              onPress={handleBackToMenu}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6b7280', '#4b5563']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <FontAwesome5 name="home" size={20} color="#fff" />
                <Text style={[styles.buttonText, { fontFamily: 'Digitalt' }]}>
                  MENÚ PRINCIPAL
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
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
  content: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // Confetti Styles
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  confettiAnimation: {
    width: '100%',
    height: '100%',
  },

  // Header Styles
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    textAlign: 'center',
  },

  // Results Styles
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  playerResult: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    alignItems: 'center',
  },
  winnerResult: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 3,
    borderColor: '#FFD700',
    elevation: 15,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  loserResult: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.7,
  },
  playerInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    borderRadius: 40,
  },
  crownIcon: {
    position: 'absolute',
    top: -15,
    right: -15,
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  playerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  playerTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 5,
    textAlign: 'center',
  },
  scoreValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },

  // VS Section Styles
  vsSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  vsLine: {
    height: 2,
    width: 100,
    backgroundColor: '#fff',
    marginVertical: 15,
  },
  vsCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    color: '#7c3aed',
    fontSize: 28,
    fontWeight: 'bold',
  },

  // Stats Styles
  statsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    minWidth: 120,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 5,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Button Styles
  buttonsContainer: {
    paddingHorizontal: 40,
    paddingBottom: 30,
    gap: 15,
  },
  playAgainButton: {
    borderRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  menuButton: {
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
