import { FontAwesome5 } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LayeredAvatar } from '@/components/LayeredAvatar';
import { useAvatar } from '@/contexts/AvatarContext';
import { useGame } from '@/contexts/GameContext';

const { width, height } = Dimensions.get('window');

export default function GameResultsScreen() {
  const [fontsLoaded] = useFonts({
    Digitalt: require('../assets/fonts/Digitalt.otf'),
    'Gilroy-Black': require('../assets/fonts/Gilroy-Black.ttf'),
  });

  const { avatar: userAvatar } = useAvatar();
  const { gameState, resetGame, getGameStats } = useGame();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  const stats = getGameStats();
  const isWinner = stats.winner?.id === gameState.players[0]?.id;
  const user = gameState.players[0];
  const opponent = gameState.players[1];

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Show confetti for winner
    if (isWinner) {
      setTimeout(() => {
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 1000);
    }
  }, []);

  const handlePlayAgain = () => {
    resetGame();
    router.dismissAll();
  };

  const handleBackToMenu = () => {
    resetGame();
    router.dismissAll();
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
        colors={isWinner ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626']}
        style={styles.gradientBackground}
      />

      {/* Confetti Animation */}
      {isWinner && (
        <Animated.View 
          style={[
            styles.confettiContainer,
            { opacity: confettiAnim }
          ]}
        >
          <LottieView
            source={require('../assets/lotties/extras/success confetti.json')}
            autoPlay
            loop={false}
            style={styles.confettiAnimation}
          />
        </Animated.View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>
              {isWinner ? '¡GANASTE!' : '¡PERDISTE!'}
            </Text>
            <Text style={[styles.subtitle, { fontFamily: 'Digitalt' }]}>
              {isWinner ? '¡Excelente trabajo!' : '¡Mejor suerte la próxima!'}
            </Text>
          </View>

          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <View style={styles.playerScoreCard}>
              <View style={styles.avatarContainer}>
                <LayeredAvatar 
                  avatar={userAvatar}
                  size={60}
                  style={styles.avatar}
                />
              </View>
              <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>
                {user?.name}
              </Text>
              <View style={[styles.scoreCircle, isWinner && styles.winnerScoreCircle]}>
                <Text style={[styles.scoreText, { fontFamily: 'Digitalt' }]}>
                  {user?.score}
                </Text>
              </View>
            </View>

            <View style={styles.vsContainer}>
              <Text style={[styles.vsText, { fontFamily: 'Digitalt' }]}>VS</Text>
            </View>

            <View style={styles.playerScoreCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.opponentAvatar}>
                  <Text style={styles.opponentAvatarText}>{opponent?.avatar}</Text>
                </View>
              </View>
              <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>
                {opponent?.name}
              </Text>
              <View style={[styles.scoreCircle, !isWinner && styles.winnerScoreCircle]}>
                <Text style={[styles.scoreText, { fontFamily: 'Digitalt' }]}>
                  {opponent?.score}
                </Text>
              </View>
            </View>
          </View>

          {/* Game Stats */}
          <View style={styles.statsContainer}>
            <Text style={[styles.statsTitle, { fontFamily: 'Digitalt' }]}>
              ESTADÍSTICAS DEL JUEGO
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <FontAwesome5 name="clock" size={20} color="#fff" />
                <Text style={[styles.statLabel, { fontFamily: 'Digitalt' }]}>Duración</Text>
                <Text style={[styles.statValue, { fontFamily: 'Digitalt' }]}>
                  {formatTime(stats.duration)}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <FontAwesome5 name="question-circle" size={20} color="#fff" />
                <Text style={[styles.statLabel, { fontFamily: 'Digitalt' }]}>Preguntas</Text>
                <Text style={[styles.statValue, { fontFamily: 'Digitalt' }]}>
                  {stats.totalQuestions}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <FontAwesome5 name="check-circle" size={20} color="#fff" />
                <Text style={[styles.statLabel, { fontFamily: 'Digitalt' }]}>Correctas</Text>
                <Text style={[styles.statValue, { fontFamily: 'Digitalt' }]}>
                  {user?.totalCorrect}
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <FontAwesome5 name="fire" size={20} color="#fff" />
                <Text style={[styles.statLabel, { fontFamily: 'Digitalt' }]}>Racha</Text>
                <Text style={[styles.statValue, { fontFamily: 'Digitalt' }]}>
                  {user?.streak}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.playAgainButton}
              onPress={handlePlayAgain}
            >
              <LinearGradient
                colors={['#FFD616', '#F65D00']}
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
        </Animated.View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  
  // Confetti
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
  
  // Title
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    opacity: 0.9,
  },
  
  // Score Display
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  playerScoreCard: {
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    borderRadius: 30,
  },
  opponentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  opponentAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 15,
    textAlign: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  winnerScoreCircle: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderColor: '#FFD700',
  },
  scoreText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  vsText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  
  // Stats
  statsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
  },
  statsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 20,
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  
  // Buttons
  buttonsContainer: {
    gap: 15,
  },
  playAgainButton: {
    borderRadius: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  menuButton: {
    borderRadius: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 25,
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
