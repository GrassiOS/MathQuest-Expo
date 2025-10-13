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
import { competitiveMascotAnimations } from '@/data/static/lotties';
import { MatchData, RoundResult } from '@/hooks/useWebSocket';

const { width, height } = Dimensions.get('window');

export default function RoundResultScreen() {
  const params = useLocalSearchParams();
  const roundResultParam = params.roundResult as string;
  const matchDataParam = params.matchData as string;
  
  const [fontsLoaded] = useFonts({
    Digitalt: require('../assets/fonts/Digitalt.otf'),
    'Gilroy-Black': require('../assets/fonts/Gilroy-Black.ttf'),
  });

  const { user } = useAuth();
  const { avatar: userAvatar } = useAvatar();
  
  // Parse data from params
  const roundResult: RoundResult = JSON.parse(roundResultParam);
  const matchData: MatchData = JSON.parse(matchDataParam);
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [showMascot, setShowMascot] = useState(false);
  
  // Animation refs
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const mascotScale = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;

  const currentPlayer = matchData.players.find(p => p.id === user?.id);
  const opponent = matchData.players.find(p => p.id !== user?.id);
  const isWinner = roundResult.winnerId === user?.id;
  const userScore = roundResult.scores[user?.id || ''];
  const opponentScore = roundResult.scores[opponent?.id || ''];

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
    }

    // Show mascot animation
    setTimeout(() => {
      setShowMascot(true);
      Animated.spring(mascotScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 1500);

    // Animate scores
    setTimeout(() => {
      Animated.timing(scoreAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }, 2000);

    // Auto-advance after 5 seconds
    const timer = setTimeout(() => {
      // This will be handled by the WebSocket hook
      // The next round will start automatically
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // The game will continue automatically via WebSocket
    router.back();
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
        colors={[
          roundResult.category.id === 'suma' ? '#6FFF8C' : 
          roundResult.category.id === 'resta' ? '#537BFD' :
          roundResult.category.id === 'multiplicacion' ? '#FF171B' :
          roundResult.category.id === 'division' ? '#FFDD6F' : '#DF5ED0',
          roundResult.category.id === 'suma' ? '#00F715' : 
          roundResult.category.id === 'resta' ? '#7EE1FF' :
          roundResult.category.id === 'multiplicacion' ? '#FF5659' :
          roundResult.category.id === 'division' ? '#F2F700' : '#C71BED'
        ]}
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
              {isWinner ? '¡VICTORIA!' : 'RONDA TERMINADA'}
            </Text>
            <Text style={[styles.headerSubtitle, { fontFamily: 'Gilroy-Black' }]}>
              {roundResult.category.displayName}
            </Text>
          </View>

          {/* Mascot Animation */}
          {showMascot && (
            <Animated.View style={[
              styles.mascotContainer,
              { transform: [{ scale: mascotScale }] }
            ]}>
              <LottieView
                source={competitiveMascotAnimations[roundResult.mascotName as keyof typeof competitiveMascotAnimations]}
                autoPlay
                loop
                style={styles.mascotAnimation}
              />
            </Animated.View>
          )}

          {/* Results */}
          <View style={styles.resultsContainer}>
            {/* Current Player */}
            <View style={[
              styles.playerResult,
              isWinner && styles.winnerResult
            ]}>
              <View style={styles.playerInfo}>
                <View style={styles.avatarContainer}>
                  <LayeredAvatar 
                    avatar={userAvatar}
                    size={60}
                    style={styles.avatar}
                  />
                  {isWinner && (
                    <View style={styles.crownIcon}>
                      <FontAwesome5 name="crown" size={20} color="#FFD700" />
                    </View>
                  )}
                </View>
                <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>
                  {currentPlayer?.username}
                </Text>
              </View>
              
              <Animated.View style={[
                styles.scoreContainer,
                { opacity: scoreAnim }
              ]}>
                <Text style={[styles.scoreLabel, { fontFamily: 'Gilroy-Black' }]}>
                  PUNTOS
                </Text>
                <Text style={[styles.scoreValue, { fontFamily: 'Digitalt' }]}>
                  {userScore?.score || 0}
                </Text>
                <Text style={[styles.correctAnswers, { fontFamily: 'Gilroy-Black' }]}>
                  {userScore?.correctAnswers || 0}/6 correctas
                </Text>
                {userScore?.fastestBonus && (
                  <View style={styles.bonusBadge}>
                    <FontAwesome5 name="bolt" size={12} color="#fff" />
                    <Text style={[styles.bonusText, { fontFamily: 'Digitalt' }]}>
                      +50 RÁPIDO
                    </Text>
                  </View>
                )}
              </Animated.View>
            </View>

            {/* VS Divider */}
            <View style={styles.vsSection}>
              <View style={styles.vsLine} />
              <View style={styles.vsCircle}>
                <Text style={[styles.vsText, { fontFamily: 'Digitalt' }]}>VS</Text>
              </View>
              <View style={styles.vsLine} />
            </View>

            {/* Opponent */}
            <View style={[
              styles.playerResult,
              !isWinner && styles.winnerResult
            ]}>
              <View style={styles.playerInfo}>
                <View style={styles.avatarContainer}>
                  <View style={styles.opponentAvatar}>
                    <Text style={[styles.opponentAvatarText, { fontFamily: 'Digitalt' }]}>
                      {opponent?.avatar?.skin_asset?.charAt(0) || 'O'}
                    </Text>
                  </View>
                  {!isWinner && (
                    <View style={styles.crownIcon}>
                      <FontAwesome5 name="crown" size={20} color="#FFD700" />
                    </View>
                  )}
                </View>
                <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>
                  {opponent?.username}
                </Text>
              </View>
              
              <Animated.View style={[
                styles.scoreContainer,
                { opacity: scoreAnim }
              ]}>
                <Text style={[styles.scoreLabel, { fontFamily: 'Gilroy-Black' }]}>
                  PUNTOS
                </Text>
                <Text style={[styles.scoreValue, { fontFamily: 'Digitalt' }]}>
                  {opponentScore?.score || 0}
                </Text>
                <Text style={[styles.correctAnswers, { fontFamily: 'Gilroy-Black' }]}>
                  {opponentScore?.correctAnswers || 0}/6 correctas
                </Text>
                {opponentScore?.fastestBonus && (
                  <View style={styles.bonusBadge}>
                    <FontAwesome5 name="bolt" size={12} color="#fff" />
                    <Text style={[styles.bonusText, { fontFamily: 'Digitalt' }]}>
                      +50 RÁPIDO
                    </Text>
                  </View>
                )}
              </Animated.View>
            </View>
          </View>

          {/* Match Progress */}
          <View style={styles.progressContainer}>
            <Text style={[styles.progressTitle, { fontFamily: 'Digitalt' }]}>
              PROGRESO DEL MATCH
            </Text>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { width: `${(matchData.currentRound / matchData.maxRounds) * 100}%` }
              ]} />
            </View>
            <Text style={[styles.progressText, { fontFamily: 'Gilroy-Black' }]}>
              Ronda {matchData.currentRound} de {matchData.maxRounds}
            </Text>
          </View>

          {/* Continue Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.continueButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <FontAwesome5 name="arrow-right" size={20} color="#fff" />
                <Text style={[styles.continueButtonText, { fontFamily: 'Digitalt' }]}>
                  CONTINUAR
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
    fontSize: 32,
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

  // Mascot Styles
  mascotContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  mascotAnimation: {
    width: 150,
    height: 100,
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
    borderWidth: 2,
    borderColor: '#FFD700',
    elevation: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  playerInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    borderRadius: 30,
  },
  opponentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  opponentAvatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  crownIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  playerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 5,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  correctAnswers: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 10,
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  bonusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // VS Section Styles
  vsSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  vsLine: {
    height: 2,
    width: 80,
    backgroundColor: '#fff',
    marginVertical: 10,
  },
  vsCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    color: '#7c3aed',
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Progress Styles
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  progressTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },

  // Button Styles
  buttonContainer: {
    paddingHorizontal: 40,
    paddingBottom: 30,
  },
  continueButton: {
    borderRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    gap: 12,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
