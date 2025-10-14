import { FontAwesome5 } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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

const NUMPAD = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  ['x', 0, 'OK'],
];

export default function OnlineGameScreen() {
  const [fontsLoaded] = useFonts({
    Digitalt: require('../assets/fonts/Digitalt.otf'),
    'Gilroy-Black': require('../assets/fonts/Gilroy-Black.ttf'),
  });

  const { user } = useAuth();
  const { avatar: userAvatar } = useAvatar();
  
  // Game state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [input, setInput] = useState('');
  const [answers, setAnswers] = useState<Record<string, { answer: string; timeTaken: number }>>({});
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [showWheelAnimation, setShowWheelAnimation] = useState(false);
  
  // Animation refs
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const wheelRotation = useRef(new Animated.Value(0)).current;
  const categoryScale = useRef(new Animated.Value(0)).current;

  // WebSocket connection
  const {
    isConnected,
    matchData,
    roundData,
    timeRemaining,
    submitAnswer,
    sendFinishedQuiz,
    roundResult,
    matchEndData
  } = useWebSocket(
    user?.id,
    user?.username || 'Player',
    userAvatar
  );

  // Debug logging
  useEffect(() => {
    console.log('🎯 Online game screen state update:', {
      isConnected,
      matchData: matchData?.matchId,
      roundData: roundData?.category?.displayName,
      roundResult: roundResult ? 'received' : 'none',
      matchEndData: matchEndData ? 'received' : 'none'
    });
    
    // Additional debugging for roundResult
    if (roundResult) {
      console.log('🎯 roundResult details:', {
        winnerId: roundResult.winnerId,
        scores: roundResult.scores,
        category: roundResult.category
      });
    }
  }, [isConnected, matchData, roundData, roundResult, matchEndData]);

  // Handle round start
  useEffect(() => {
    if (roundData) {
      setCurrentQuestionIndex(0);
      setInput('');
      setAnswers({});
      setShowWheelAnimation(true);
      
      // Animate wheel rotation
      Animated.timing(wheelRotation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();

      // Show category after wheel animation
      setTimeout(() => {
        setShowWheelAnimation(false);
        Animated.spring(categoryScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }).start();
        
        // Start first question timer
        setQuestionStartTime(Date.now());
      }, 2000);
    }
  }, [roundData]);

  // Handle round result
  useEffect(() => {
    console.log('🎯 roundResult useEffect triggered:', { roundResult, matchData });
    if (roundResult) {
      console.log('🎯 Navigating to round result screen with data:', {
        roundResult,
        matchData
      });
      try {
        // Navigate to round result screen
        router.push({
          pathname: '/round-result-screen',
          params: {
            roundResult: JSON.stringify(roundResult),
            matchData: JSON.stringify(matchData)
          }
        });
        console.log('🎯 Navigation command sent successfully');
      } catch (error) {
        console.error('🎯 Navigation error:', error);
      }
    }
  }, [roundResult, matchData]);

  // Handle match end
  useEffect(() => {
    if (matchEndData) {
      // Navigate to match end screen
      router.push({
        pathname: '/match-end-screen',
        params: {
          matchEndData: JSON.stringify(matchEndData)
        }
      });
    }
  }, [matchEndData]);

  const handlePress = (val: string | number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (val === 'x') {
      setInput(input.slice(0, -1));
      triggerBounceAnimation();
    } else if (val === 'OK') {
      handleSubmitAnswer();
    } else {
      setInput(input + val);
      triggerBounceAnimation();
    }
  };

  const handleSubmitAnswer = () => {
    if (!roundData || currentQuestionIndex >= roundData.questions.length) return;

    const currentQuestion = roundData.questions[currentQuestionIndex];
    const timeTaken = Date.now() - questionStartTime;
    
    // Store answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        answer: input.trim(),
        timeTaken
      }
    }));

    // Submit to server
    submitAnswer(currentQuestion.id, input.trim(), timeTaken);

    // Move to next question or finish quiz
    if (currentQuestionIndex < roundData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setInput('');
      setQuestionStartTime(Date.now());
    } else {
      // Quiz finished - calculate final score and send FINISHED_QUIZ
      const finalScore = Object.values(answers).reduce((score, answerData) => {
        const question = roundData.questions.find(q => q.id === Object.keys(answers).find(key => answers[key] === answerData));
        if (question && answerData.answer === question.respuestaCorrecta) {
          return score + 1;
        }
        return score;
      }, 0);
      
      // Add current question to score if correct
      const currentQuestionCorrect = input.trim() === currentQuestion.respuestaCorrecta;
      const totalScore = finalScore + (currentQuestionCorrect ? 1 : 0);
      
      console.log('🎯 Quiz finished! Final score:', totalScore);
      
      // Send FINISHED_QUIZ message
      if (sendFinishedQuiz && matchData) {
        sendFinishedQuiz(totalScore);
      }
    }
  };

  const triggerBounceAnimation = () => {
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!roundData) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#8b5cf6', '#a855f7']}
          style={styles.gradientBackground}
        />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <FontAwesome5 name="chevron-left" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontFamily: 'Digitalt' }]}>
              PREPARANDO RONDA...
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.waitingContainer}>
            <LottieView
              source={require('../assets/lotties/extras/lupa.json')}
              style={styles.waitingAnimation}
              autoPlay
              loop
            />
            <Text style={[styles.waitingText, { fontFamily: 'Digitalt' }]}>
              Preparando preguntas...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const currentQuestion = roundData.questions[currentQuestionIndex];
  const currentPlayer = matchData?.players.find(p => p.id === user?.id);
  const opponent = matchData?.players.find(p => p.id !== user?.id);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[roundData.category.id === 'suma' ? '#6FFF8C' : 
                 roundData.category.id === 'resta' ? '#537BFD' :
                 roundData.category.id === 'multiplicacion' ? '#FF171B' :
                 roundData.category.id === 'division' ? '#FFDD6F' : '#DF5ED0',
                 roundData.category.id === 'suma' ? '#00F715' : 
                 roundData.category.id === 'resta' ? '#7EE1FF' :
                 roundData.category.id === 'multiplicacion' ? '#FF5659' :
                 roundData.category.id === 'division' ? '#F2F700' : '#C71BED']}
        style={styles.gradientBackground}
      />

      {/* Wheel Animation Overlay */}
      {showWheelAnimation && (
        <View style={styles.wheelOverlay}>
          <Animated.View style={[
            styles.wheelContainer,
            {
              transform: [
                {
                  rotate: wheelRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '1440deg'], // 4 full rotations
                  })
                }
              ]
            }
          ]}>
            <View style={styles.wheel}>
              <Text style={[styles.wheelText, { fontFamily: 'Digitalt' }]}>
                {roundData.category.displayName.toUpperCase()}
              </Text>
            </View>
          </Animated.View>
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <FontAwesome5 name="chevron-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontFamily: 'Digitalt' }]}>
            {roundData.category.displayName.toUpperCase()}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Competitive Header */}
        <View style={styles.competitiveHeader}>
          <View style={styles.playerSection}>
            <View style={styles.playerRow}>
              <View style={styles.avatarContainer}>
                <LayeredAvatar 
                  avatar={userAvatar}
                  size={35}
                />
              </View>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>
                  {currentPlayer?.username}
                </Text>
                <Text style={[styles.playerScore, { fontFamily: 'Digitalt' }]}>
                  {Object.keys(answers).length.toString().padStart(2, '0')}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Progress indicator */}
          <View style={styles.progressSection}>
            <Text style={[styles.progressText, { fontFamily: 'Digitalt' }]}>
              {currentQuestionIndex + 1}/{roundData.questions.length}
            </Text>
          </View>
          
          <View style={styles.playerSection}>
            <View style={styles.playerRow}>
              <View style={styles.avatarContainer}>
                <View style={styles.opponentAvatar}>
                  <Text style={[styles.opponentAvatarText, { fontFamily: 'Digitalt' }]}>
                    {opponent?.avatar?.skin_asset?.charAt(0) || 'O'}
                  </Text>
                </View>
              </View>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>
                  {opponent?.username}
                </Text>
                <Text style={[styles.playerScore, { fontFamily: 'Digitalt' }]}>
                  00
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Lottie Character */}
          <Animated.View style={[
            styles.lottieContainer,
            { transform: [{ scale: categoryScale }] }
          ]}>
            <LottieView
              source={competitiveMascotAnimations[roundData.category.mascotName as keyof typeof competitiveMascotAnimations]}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
          </Animated.View>

          {/* Question */}
          <View style={styles.questionContainer}>
            <Text style={[styles.questionText, { fontFamily: 'Digitalt' }]}>
              {currentQuestion?.texto}
            </Text>
          </View>
          
          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, { fontFamily: 'Digitalt' }]}>
              {Math.ceil(timeRemaining / 1000)}s
            </Text>
          </View>

          {/* Answer Input */}
          <Animated.View style={[
            styles.answerContainer,
            { transform: [{ scale: bounceAnim }] }
          ]}>
            <Text style={[
              styles.answerText,
              input === '' ? styles.answerTextEmpty : null,
              { fontFamily: 'Digitalt' }
            ]}>
              {input || '0'}
            </Text>
          </Animated.View>

          {/* Calculator Grid */}
          <View style={styles.calculatorGrid}>
            {NUMPAD.map((row, i) => (
              <View key={i} style={styles.calculatorRow}>
                {row.map((val, j) => (
                  <TouchableOpacity
                    key={j}
                    style={[
                      styles.calculatorButton,
                      val === 'OK' ? styles.okButton : null
                    ]}
                    onPress={() => handlePress(val)}
                  >
                    {val === 'x' ? (
                      <FontAwesome5 name="backspace" size={24} color="#fff" />
                    ) : (
                      <Text style={[
                        styles.calculatorButtonText,
                        val === 'OK' ? styles.okButtonText : null,
                        { fontFamily: 'Digitalt' }
                      ]}>
                        {val}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
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
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },

  // Wheel Animation Styles
  wheelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheel: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: '#7c3aed',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  wheelText: {
    color: '#7c3aed',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },

  // Competitive Header Styles
  competitiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  playerSection: {
    alignItems: 'flex-start',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  opponentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  opponentAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerInfo: {
    alignItems: 'flex-start',
  },
  playerName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  playerScore: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  progressSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },

  // Main Content Styles
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  // Waiting State Styles
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingAnimation: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  waitingText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Lottie Character Styles
  lottieContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  lottieAnimation: {
    width: 200,
    height: 120,
  },

  // Question and Answer Styles
  questionContainer: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 40,
    marginBottom: 15,
    width: '85%',
    alignItems: 'center',
    opacity: 0.5,
  },
  questionText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  timerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 15,
  },
  timerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  answerContainer: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginBottom: 25,
    width: '85%',
    alignItems: 'center',
  },
  answerText: {
    color: '#1f2937',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  answerTextEmpty: {
    color: '#9ca3af',
  },

  // Calculator Styles
  calculatorGrid: {
    marginBottom: 20,
  },
  calculatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 16,
  },
  calculatorButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 26,
    width: 86,
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculatorButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  okButton: {
    backgroundColor: '#ec4899',
  },
  okButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
