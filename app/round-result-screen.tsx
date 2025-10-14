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
import { useWebSocket } from '@/hooks/useWebSocket';

const { width, height } = Dimensions.get('window');

export default function RoundResultScreen() {
  const params = useLocalSearchParams();
  const userScore = parseInt(params.userScore as string) || 0;
  const totalQuestions = parseInt(params.totalQuestions as string) || 0;
  const categoryId = params.categoryId as string || 'suma';
  const categoryName = params.categoryName as string || 'Suma';
  const bgColor1 = params.bgColor1 as string || '#6FFF8C';
  const bgColor2 = params.bgColor2 as string || '#00F715';
  const roundNumber = parseInt(params.roundNumber as string) || 1;
  const roundResultParam = params.roundResult as string;
  const matchDataParam = params.matchData as string;
  const waitingForOpponent = params.waitingForOpponent === 'true';
  
  const [fontsLoaded] = useFonts({
    Digitalt: require('../assets/fonts/Digitalt.otf'),
    'Gilroy-Black': require('../assets/fonts/Gilroy-Black.ttf'),
  });

  const { user } = useAuth();
  const { avatar: userAvatar } = useAvatar();
  
  // Parse round result data from server
  const roundResult = roundResultParam ? JSON.parse(roundResultParam) : null;
  const matchData = matchDataParam ? JSON.parse(matchDataParam) : null;
  
  // Use WebSocket roundResult if available, otherwise use navigation params
  const effectiveRoundResult = wsRoundResult || roundResult;
  
  // Debug logging
  console.log('🎯 RoundResultScreen mounted with:', {
    waitingForOpponent,
    roundResultParam: roundResultParam ? 'Available' : 'null',
    matchDataParam: matchDataParam ? 'Available' : 'null',
    roundResult: roundResult ? 'Parsed successfully' : 'null',
    wsRoundResult: wsRoundResult ? 'Available from WebSocket' : 'null',
    effectiveRoundResult: effectiveRoundResult ? 'Available' : 'null',
    matchData: matchData ? 'Parsed successfully' : 'null'
  });
  
  // WebSocket connection for sending ready for next round
  const { 
    sendReadyForNextRound, 
    sendReadyToViewResults,
    isConnected,
    bothPlayersReadyForResults,
    resultsDelay,
    roundResult: wsRoundResult,
    showResults: wsShowResults
  } = useWebSocket(
    user?.id,
    user?.username || 'Player',
    userAvatar,
    matchData // Pass matchData to WebSocket hook
  );

  // State for managing results display
  const [showResults, setShowResults] = useState(false);
  const [bothPlayersReady, setBothPlayersReady] = useState(false);
  const [showScorePanel, setShowScorePanel] = useState(false);
  const [showMascotAnimation, setShowMascotAnimation] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [hasClickedShowResults, setHasClickedShowResults] = useState(false);
  const [userScoreAnimated, setUserScoreAnimated] = useState(0);
  const [opponentScoreAnimated, setOpponentScoreAnimated] = useState(0);
  
  // Get opponent data from match data
  const getOpponent = () => {
    if (!matchData || !user?.id) return null;
    return matchData.players.find((player: any) => player.id !== user.id);
  };
  
  const opponent = getOpponent();
  
  // Calculate scores and winner from server data
  let opponentScore = 0;
  let isWinner = false;
  let mascotAsset = competitiveMascotAnimations.Plusito;
  
  if (effectiveRoundResult && user?.id) {
    // Get scores from server result
    const userScoreData = effectiveRoundResult.scores[user.id];
    const opponentScoreData = effectiveRoundResult.scores[opponent?.id];
    
    if (userScoreData && opponentScoreData) {
      // Convert server scores (points) to correct answers count
      opponentScore = Math.floor(opponentScoreData.score / 100); // 100 points per correct answer
      isWinner = userScoreData.score > opponentScoreData.score;
    }
    
    // Use mascot from server data
    if (effectiveRoundResult.mascotAsset) {
      mascotAsset = competitiveMascotAnimations[effectiveRoundResult.mascotAsset as keyof typeof competitiveMascotAnimations] || competitiveMascotAnimations.Plusito;
    }
  } else {
    // Fallback to simulated data if no server data
    opponentScore = Math.floor(Math.random() * totalQuestions);
    isWinner = userScore > opponentScore;
    mascotAsset = competitiveMascotAnimations[categoryId as keyof typeof competitiveMascotAnimations] || competitiveMascotAnimations.Plusito;
  }

  // Animation refs
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const mascotScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Don't automatically send ready to view results - wait for button click
  }, [isConnected, waitingForOpponent, sendReadyToViewResults]);

  // Handle both players ready for results
  useEffect(() => {
    console.log('🎯 username:', user?.username);
    console.log('🎯 [LOG] [LOG] bothPlayersReadyForResults_____8==D:', bothPlayersReadyForResults);
    console.log('🎯 [LOG] [LOG] waitingForOpponent_____8==D:', waitingForOpponent);
    console.log('🎯 [LOG] [LOG] roundResult_____8==D:', roundResult ? 'Available' : 'null');
    console.log('🎯 [LOG] [LOG] wsRoundResult_____8==D:', wsRoundResult ? 'Available' : 'null');
    console.log('🎯 [LOG] [LOG] effectiveRoundResult_____8==D:', effectiveRoundResult ? 'Available' : 'null');

    // If we have roundResult data from server, we should show results immediately
    // The waitingForOpponent is only for the initial state when player finishes first
    if (bothPlayersReadyForResults || effectiveRoundResult) {
      console.log('🎯 Both players ready for results OR effectiveRoundResult available, starting fade-in sequence');
      setBothPlayersReady(true);
      
      // Start fade-in sequence after delay
      setTimeout(() => {
        setShowResults(true);
        
        // Show score panel first
        setTimeout(() => {
          setShowScorePanel(true);
        }, 500);
        
        // Show mascot animation if winner
        if (isWinner) {
          setTimeout(() => {
            setShowMascotAnimation(true);
            setShowMascot(true);
            Animated.spring(mascotScale, {
              toValue: 1,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }).start();
          }, 1000);
        }
        
        // Show continue button last
        setTimeout(() => {
          setShowContinueButton(true);
        }, 1500);
        
      }, effectiveRoundResult ? 500 : resultsDelay); // Shorter delay if we already have results
    }
  }, [bothPlayersReadyForResults, effectiveRoundResult, isWinner, resultsDelay]);

  // Handle countup animation for scores
  useEffect(() => {
    if (showScorePanel && effectiveRoundResult && user?.id && opponent?.id) {
      const userFinalScore = effectiveRoundResult.scores[user.id]?.score || userScore * 100;
      const opponentFinalScore = effectiveRoundResult.scores[opponent.id]?.score || opponentScore * 100;
      
      // Animate user score
      const userDuration = 2000; // 2 seconds
      const userSteps = 60; // 60 steps for smooth animation
      const userStepValue = userFinalScore / userSteps;
      
      let userStep = 0;
      const userInterval = setInterval(() => {
        userStep++;
        setUserScoreAnimated(Math.min(userStep * userStepValue, userFinalScore));
        
        if (userStep >= userSteps) {
          clearInterval(userInterval);
          setUserScoreAnimated(userFinalScore);
        }
      }, userDuration / userSteps);

      // Animate opponent score (start slightly after user score)
      setTimeout(() => {
        const opponentDuration = 2000;
        const opponentSteps = 60;
        const opponentStepValue = opponentFinalScore / opponentSteps;
        
        let opponentStep = 0;
        const opponentInterval = setInterval(() => {
          opponentStep++;
          setOpponentScoreAnimated(Math.min(opponentStep * opponentStepValue, opponentFinalScore));
          
          if (opponentStep >= opponentSteps) {
            clearInterval(opponentInterval);
            setOpponentScoreAnimated(opponentFinalScore);
          }
        }, opponentDuration / opponentSteps);
      }, 500); // Start 0.5 seconds after user score

      return () => {
        clearInterval(userInterval);
      };
    }
  }, [showScorePanel, effectiveRoundResult, user?.id, opponent?.id]);

  const [showMascot, setShowMascot] = useState(false);

  const handleShowResults = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    console.log('🎯 Show Results button clicked');
    setHasClickedShowResults(true);
    
    // Send ready to view results message
    if (isConnected) {
      sendReadyToViewResults();
    }
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    console.log('🎯 Continue button pressed');
    console.log('🎯 WebSocket connected:', isConnected);
    console.log('🎯 Match data:', matchData);
    console.log('🎯 User ID:', user?.id);
    
    // Check if match is over (based on rounds won)
    const maxRoundsWon = Math.max(...matchData.players.map((p: any) => p.roundsWon || 0));
    console.log('🎯 Max rounds won:', maxRoundsWon);
    
    if (maxRoundsWon >= 3) { // First to 3 wins
      // Match is over, go back to main menu
      console.log('🎯 Match is over, going back to main menu');
      router.back();
    } else {
      // Send ready for next round message
      console.log('🎯 Sending ready for next round');
      sendReadyForNextRound();
      // Navigate to online game screen for next round
      console.log('🎯 Navigating to online game screen for next round');
      router.push('/online-game-screen');
    }
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
        colors={[bgColor1, bgColor2]}
        style={styles.gradientBackground}
      />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[
          styles.content,
          {
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim
          }
        ]}>
          {/* Round Indicator */}
          <View style={styles.roundContainer}>
            <Text style={[styles.roundText, { fontFamily: 'Digitalt' }]}>
              RONDA {roundNumber}
            </Text>
          </View>

          {/* Player Section - Top */}
          <View style={styles.topPlayerSection}>
            <View style={styles.playerInfo}>
              <View style={styles.avatarContainer}>
                <LayeredAvatar 
                  avatar={userAvatar}
                  size={50}
                  style={styles.avatar}
                />
              </View>
              <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>
                {user?.username || 'Player1'}
              </Text>
            </View>

            <View style={styles.playerInfo}>
              <View style={styles.avatarContainer}>
                <LayeredAvatar 
                  avatar={opponent?.avatar || userAvatar}
                  size={50}
                  style={styles.avatar}
                />
              </View>
              <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>
                {opponent?.username || 'Player2'}
              </Text>
            </View>
          </View>

          {/* Score Panel or Waiting Message */}
          {waitingForOpponent && !effectiveRoundResult ? (
            <View style={styles.waitingPanel}>
              <View style={styles.waitingAnimation}>
                <LottieView
                  source={require('../assets/lotties/extras/lupa.json')}
                  autoPlay
                  loop
                  style={styles.waitingLottie}
                />
              </View>
              <Text style={[styles.waitingTitle, { fontFamily: 'Digitalt' }]}>
                ESPERANDO OPONENTE
              </Text>
              <Text style={[styles.waitingSubtitle, { fontFamily: 'Digitalt' }]}>
                Tu puntaje: {userScore}/{totalQuestions}
              </Text>
            </View>
          ) : !hasClickedShowResults && !effectiveRoundResult ? (
            <View style={styles.showResultsContainer}>
              <Text style={[styles.showResultsTitle, { fontFamily: 'Digitalt' }]}>
                ¡Ambos jugadores terminaron!
              </Text>
              <TouchableOpacity
                style={styles.showResultsButton}
                onPress={handleShowResults}
              >
                <LinearGradient
                  colors={['#FFD616', '#F65D00']}
                  style={styles.showResultsButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.showResultsButtonText, { fontFamily: 'Gilroy-Black' }]}>
                    MOSTRAR RESULTADOS
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : showScorePanel ? (
            <Animated.View 
              style={[
                styles.scorePanel,
                {
                  opacity: showScorePanel ? 1 : 0,
                  transform: [{ scale: showScorePanel ? 1 : 0.8 }]
                }
              ]}
            >
              <View style={styles.scoreSection}>
                {isWinner && (
                  <View style={styles.crownContainer}>
                    <FontAwesome5 name="crown" size={24} color="#FFD700" />
                  </View>
                )}
                <Text style={[styles.scoreLabel, { fontFamily: 'Digitalt' }]}>
                  Puntaje
                </Text>
                <Text style={[styles.scoreValue, { fontFamily: 'Digitalt' }]}>
                  {Math.floor(userScoreAnimated)}
                </Text>
              </View>

              <View style={styles.scoreSection}>
                <Text style={[styles.scoreLabel, { fontFamily: 'Digitalt' }]}>
                  Puntaje
                </Text>
                <Text style={[styles.scoreValue, { fontFamily: 'Digitalt' }]}>
                  {Math.floor(opponentScoreAnimated)}
                </Text>
              </View>
            </Animated.View>
          ) : null}

          {/* Mascot - only show when showing results */}
          {(!waitingForOpponent || effectiveRoundResult) && showMascotAnimation && showMascot && isWinner && (
            <Animated.View style={[
              styles.mascotContainer,
              { 
                opacity: showMascotAnimation ? 1 : 0,
                transform: [
                  { scale: mascotScale },
                  { translateY: showMascotAnimation ? 0 : 20 }
                ]
              }
            ]}>
              <LottieView
                source={mascotAsset}
                autoPlay
                loop
                style={styles.mascotAnimation}
              />
            </Animated.View>
          )}

          {/* Continue Button - only show when showing results */}
          {(!waitingForOpponent || effectiveRoundResult) && showContinueButton && (
            <Animated.View
              style={{
                opacity: showContinueButton ? 1 : 0,
                transform: [
                  { scale: showContinueButton ? 1 : 0.9 },
                  { translateY: showContinueButton ? 0 : 10 }
                ]
              }}
            >
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <LinearGradient
                  colors={['#FFD616', '#F65D00']}
                  style={styles.continueButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.continueButtonText, { fontFamily: 'Gilroy-Black' }]}>
                    Siguiente
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
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
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  roundContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  roundText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  topPlayerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  playerInfo: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatar: {
    borderRadius: 25,
  },
  playerName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scorePanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreSection: {
    alignItems: 'center',
    flex: 1,
  },
  crownContainer: {
    marginBottom: 10,
  },
  scoreLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  waitingPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 40,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingAnimation: {
    marginBottom: 20,
  },
  waitingLottie: {
    width: 100,
    height: 100,
  },
  waitingTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 2,
  },
  waitingSubtitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    opacity: 0.8,
  },
  showResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  showResultsTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  showResultsButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  showResultsButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  showResultsButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mascotContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  mascotAnimation: {
    width: 150,
    height: 150,
  },
  continueButton: {
    borderRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    marginBottom: 30,
  },
  continueButtonGradient: {
    paddingHorizontal: 60,
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});