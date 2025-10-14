import { FontAwesome5 } from '@expo/vector-icons';
import DrawPad, { DrawPadHandle } from "expo-drawpad";
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import { LayeredAvatar } from '@/components/LayeredAvatar';
import GradientBackground from '@/components/ui/GradientBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatar } from '@/contexts/AvatarContext';
import { useGame } from '@/contexts/GameContext';
import { competitiveMascotAnimations } from '@/data/static/lotties';
import { useWebSocket } from '@/hooks/useWebSocket';
import { categories } from '../data/static/categories';
import { Question } from '../types/question';

const INITIAL_USER_1 = {
  name: 'GRASSYOG',
  avatar: 'G',
  hasPlus: true,
};
const INITIAL_USER_2 = {
  name: 'TESTUSER',
  avatar: 'T',
  hasPlus: false,
};

const NUMPAD = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  ['x', 0, 'OK'],
];


const { width, height } = Dimensions.get('window');

export default function QuizScreen() {
  const params = useLocalSearchParams();
  const categoryId = params.categoryId as string || 'resta';
  const bgColor1 = params.bgColor1 as string || '#537BFD';
  const bgColor2 = params.bgColor2 as string || '#7EE1FF';
  const questionsParam = params.questions as string;
  const matchId = params.matchId as string;
  const matchDataParam = params.matchData as string;
  
  
  // Parse match data if available
  const matchData = matchDataParam ? JSON.parse(matchDataParam) : null;
  
  const { avatar: userAvatar } = useAvatar();
  const { user } = useAuth();
  const { gameState, submitAnswer, nextQuestion, getCurrentQuestion, getOpponent: gameGetOpponent } = useGame();
  const category = categories[categoryId] || categories.resta;
  
  // Get opponent data from match data
  const getOpponent = () => {
    if (!matchData || !user?.id) return null;
    
    const opponent = matchData.players.find((player: any) => player.id !== user.id);
    return opponent;
  };
  
  const opponent = getOpponent();
  
  // WebSocket connection for online mode
  const {
    sendMessage,
    sendFinishedQuiz,
    opponentFinished,
    showOpponentFinishAnimation,
    timeRemaining: wsTimeRemaining,
    roundResult,
    showResults,
    matchData: wsMatchData
  } = useWebSocket(
    user?.id,
    user?.username || 'Player',
    userAvatar,
    matchData // Pass matchData to WebSocket hook
  );
  
  // Use matchData from WebSocket if available, otherwise use params
  const effectiveMatchData = wsMatchData || matchData;
  
  // Parse questions from params
  const questions: Question[] = questionsParam ? JSON.parse(questionsParam) : [];
  
  // State management
  const [input, setInput] = useState('');
  const [showDrawPad, setShowDrawPad] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15);
  
  const drawPadRef = useRef<DrawPadHandle>(null);
  const currentQuestion = questions[currentQuestionIndex] || null;
  const gameUser = gameState.players[0];
  const matchOpponent = getOpponent();
  const [fontsLoaded] = useFonts({
    Digitalt: require('../assets/fonts/Digitalt.otf'),
  });
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Handle opponent finish animation and countdown
  useEffect(() => {
    if (showOpponentFinishAnimation) {
      // Show animation for 4 seconds, then start countdown
      setTimeout(() => {
        setTimeRemaining(Math.floor(wsTimeRemaining / 1000)); // Convert to seconds
      }, 4000);
    }
  }, [showOpponentFinishAnimation, wsTimeRemaining]);

  // Navigate to round result screen immediately when player finishes
  useEffect(() => {
    if (isFinished && effectiveMatchData) {
      console.log('🎯 Player finished quiz, navigating to round result screen');
      router.push({
        pathname: '/round-result-screen',
        params: {
          userScore: userScore.toString(),
          totalQuestions: questions.length.toString(),
          categoryId: category.id,
          categoryName: category.displayName,
          bgColor1: category.bgColor1,
          bgColor2: category.bgColor2,
          roundNumber: effectiveMatchData.currentRound?.toString() || '1',
          matchData: effectiveMatchData ? JSON.stringify(effectiveMatchData) : undefined,
          waitingForOpponent: 'true' // Indicate this is waiting state
        }
      });
    }
  }, [isFinished, effectiveMatchData, userScore, questions.length, category, router]);

  // Listen for SHOW_RESULTS to update the results screen with actual data
  useEffect(() => {
    if (showResults && roundResult) {
      //console.log('🎯 SHOW_RESULTS received, updating round result screen');
      router.push({
        pathname: '/round-result-screen',
        params: {
          userScore: userScore.toString(),
          totalQuestions: questions.length.toString(),
          categoryId: roundResult.category?.id || category.id,
          categoryName: roundResult.category?.displayName || category.displayName,
          bgColor1: roundResult.category?.bgColor1 || category.bgColor1,
          bgColor2: roundResult.category?.bgColor2 || category.bgColor2,
          roundNumber: effectiveMatchData?.currentRound?.toString() || '1',
          roundResult: JSON.stringify(roundResult),
          matchData: effectiveMatchData ? JSON.stringify(effectiveMatchData) : undefined,
          waitingForOpponent: 'false' // Show actual results
        }
      });
    }
  }, [showResults, roundResult, userScore, questions.length, category, effectiveMatchData, router]);

  // Handle 15-second countdown when opponent finishes
  useEffect(() => {
    if (opponentFinished && timeRemaining > 0 && !isFinished && !showOpponentFinishAnimation) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - force finish the quiz
            if (effectiveMatchData) {
              sendFinishedQuiz(userScore);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [opponentFinished, timeRemaining, showOpponentFinishAnimation, isFinished, userScore, sendFinishedQuiz]);
  
  // DrawPad shared values
  const pathLength = useSharedValue(0);
  const playing = useSharedValue(false);
  const signed = useSharedValue(false);

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

  const showDrawPadModal = () => {
    // Reset animation values before showing
    slideAnim.setValue(height);
    overlayOpacity.setValue(0);
    
    setShowDrawPad(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const hideDrawPadModal = () => {
    // Immediately hide modal to prevent touch blocking
    setShowDrawPad(false);
    
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: height,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDrawPadClear = () => {
    drawPadRef.current?.erase();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDrawPadOK = () => {
    drawPadRef.current?.erase();
    hideDrawPadModal();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const checkAnswer = () => {
    if (!currentQuestion || input.trim() === '') return;
    
    const isCorrect = input.trim() === currentQuestion.respuestaCorrecta;
    setIsAnswerCorrect(isCorrect);
    setShowResult(true);
    
    if (isCorrect) {
      setUserScore(prev => prev + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Auto advance after 2 seconds
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        // Move to next question
        setCurrentQuestionIndex(prev => prev + 1);
        setInput('');
        setIsAnswerCorrect(null);
        setShowResult(false);
      } else {
        // Quiz finished
        const finalScore = userScore + (isCorrect ? 1 : 0);
        setIsFinished(true);
        
        // Send FINISHED_QUIZ message
        if (effectiveMatchData) {
          sendFinishedQuiz(finalScore);
        }
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }, 2000);
  };

  const handlePress = (val: string | number) => {
    if (showResult) return; // Don't allow input while showing result
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (val === 'x') {
      setInput(input.slice(0, -1));
      triggerBounceAnimation();
    } else if (val === 'OK') {
      checkAnswer();
    } else {
      setInput(input + val);
      triggerBounceAnimation();
    }
  };

  if (!fontsLoaded) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading...</Text></View>;
  }

  return (
    <GradientBackground colors={[bgColor1, bgColor2]}>
      {/* Competitive Header */}
      <View style={styles.headerContainer}>
          <View style={styles.competitiveHeader}>
            <View style={styles.playerSection}>
              <View style={styles.playerRow}>
                <View style={styles.avatarEmojiContainer}>
                  <LayeredAvatar 
                    avatar={userAvatar}
                    size={35}
                  />
                </View>
                <View style={styles.playerInfo}>
                  <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>{user?.username || gameUser?.name || INITIAL_USER_1.name}</Text>
                  <Text style={[styles.playerScore, { fontFamily: 'Digitalt' }]}>{userScore.toString().padStart(2, '0')}</Text>
                </View>
              </View>
            </View>
            
            {/* Progress indicator / Timer */}
            <View style={styles.progressSection}>
              {opponentFinished && !isFinished && !showOpponentFinishAnimation ? (
                <Text style={[styles.timerText, { fontFamily: 'Digitalt' }]}>
                  {timeRemaining}s
                </Text>
              ) : (
                <Text style={[styles.progressText, { fontFamily: 'Digitalt' }]}>
                  {currentQuestionIndex + 1}/{questions.length}
                </Text>
              )}
            </View>
            
            <View style={styles.playerSection}>
              <View style={styles.playerRow}>
                <View style={styles.avatarEmojiContainer}>
                  <LayeredAvatar 
                    avatar={matchOpponent?.avatar || userAvatar}
                    size={35}
                  />
                </View>
                <View style={styles.playerInfo}>
                  <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>{matchOpponent?.username || INITIAL_USER_2.name}</Text>
                  <Text style={[styles.playerScore, { fontFamily: 'Digitalt' }]}>{matchOpponent?.score?.toString().padStart(2, '0') || '00'}</Text>
                </View>
              </View>
            </View>
          </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>

        {/* Lottie Character */}
        <View style={styles.lottieContainer}>
          <LottieView
            source={competitiveMascotAnimations[category.mascotName as keyof typeof competitiveMascotAnimations]}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>

        {/* Math Problem */}
        <View style={styles.questionContainer}>
          <Text style={[styles.questionText, { fontFamily: 'Digitalt' }]}>
            {currentQuestion?.texto || 'Loading...'}
          </Text>
        </View>
        

                {/* Time-15 Animation - Show when opponent finishes */}
                {showOpponentFinishAnimation && (
                  <View style={styles.timeAnimationOverlay}>
                    <View style={styles.opponentFinishContainer}>
                      <LottieView
                        source={require('../assets/lotties/extras/Time-15.json')}
                        autoPlay
                        loop={false}
                        style={styles.timeAnimation}
                      />
                      <Text style={[styles.opponentFinishText, { fontFamily: 'Digitalt' }]}>
                        ¡Tu oponente terminó!{'\n'}Tienes 15 segundos restantes
                      </Text>
                    </View>
                  </View>
                )}

        
        {/* Confetti Animation for Correct Answers */}
        {showResult && isAnswerCorrect && (
          <View style={styles.confettiContainer}>
            <LottieView
              source={require('../assets/lotties/extras/Confetti_quick.json')}
              autoPlay
              loop={false}
              style={styles.confettiAnimation}
            />
          </View>
        )}

        {/* Answer Input */}
        <Animated.View style={[
          styles.answerContainer,
          { transform: [{ scale: bounceAnim }] },
          showResult && isAnswerCorrect ? styles.answerContainerCorrect : null,
          showResult && !isAnswerCorrect ? styles.answerContainerIncorrect : null,
        ]}>
          <Text style={[
            styles.answerText,
            input === '' ? styles.answerTextEmpty : null,
            showResult && isAnswerCorrect ? styles.answerTextCorrect : null,
            showResult && !isAnswerCorrect ? styles.answerTextIncorrect : null,
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

        {/* Bottom Toolbar */}
        <View style={styles.bottomToolbar}>
          <TouchableOpacity style={styles.toolbarButton} onPress={showDrawPadModal}>
            <FontAwesome5 name="chalkboard" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <FontAwesome5 name="lightbulb" size={24} color="#fff" />
            <View style={styles.notificationBadge}>
              <Text style={[styles.notificationText, { fontFamily: 'Digitalt' }]}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* DrawPad Modal */}
      <Modal
        visible={showDrawPad}
        transparent={true}
        animationType="none"
        onRequestClose={hideDrawPadModal}
      >
        <Animated.View style={[
          styles.modalOverlay,
          { opacity: overlayOpacity }
        ]}>
          <Animated.View style={[
            styles.drawPadContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}>
            {/* DrawPad Header */}
            <View style={styles.drawPadHeader}>
              <View style={styles.headerLeft}>
                <FontAwesome5 name="chalkboard" size={18} color="#fff" />
                <Text style={[styles.drawPadTitle, { fontFamily: 'Digitalt' }]}>PIZARRÓN</Text>
              </View>
              <TouchableOpacity onPress={hideDrawPadModal} style={styles.closeButton}>
                <FontAwesome5 name="times" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* DrawPad Canvas */}
            <View style={styles.drawPadCanvas}>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <DrawPad
                  ref={drawPadRef}
                  stroke="#000000"
                  strokeWidth={3}
                  pathLength={pathLength}
                  playing={playing}
                  signed={signed}
                />
              </GestureHandlerRootView>
            </View>

            {/* DrawPad Controls */}
            <View style={styles.drawPadControls}>
              <TouchableOpacity style={styles.controlButton} onPress={handleDrawPadClear}>
                <FontAwesome5 name="eraser" size={18} color="#fff" />
                <Text style={[styles.controlButtonText, { fontFamily: 'Digitalt' }]}>CLEAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.controlButton, styles.okControlButton]} onPress={handleDrawPadOK}>
                <FontAwesome5 name="check" size={18} color="#fff" />
                <Text style={[styles.controlButtonText, { fontFamily: 'Digitalt' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  safeAreaHeader: {
    backgroundColor: 'transparent',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingTop: 100, // Reduced to move content up
  },
  // Competitive Header Styles
  competitiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 20,
    paddingHorizontal: 30,
  },
  playerSection: {
    alignItems: 'flex-start',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerInfo: {
    alignItems: 'flex-start',
  },
  avatarEmoji: {
    fontSize: 32,
    backgroundColor: '#4f46e5',
    borderRadius: 20,
    width: 40,
    height: 40,
    textAlign: 'center',
    lineHeight: 40,
  },
  avatarEmojiContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
  timerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  // Lottie Character Styles
  lottieContainer: {
    alignItems: 'center',
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
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  waitingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  waitingContainer: {
    backgroundColor: 'rgba(0, 150, 0, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  waitingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
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
  answerContainerEmpty: {
    opacity: 0.8,
  },
  answerTextEmpty: {
    color: '#9ca3af',
  },
  answerContainerCorrect: {
    backgroundColor: '#dcfce7', // Light green background
    borderWidth: 2,
    borderColor: '#22c55e', // Green border
  },
  answerContainerIncorrect: {
    backgroundColor: '#fef2f2', // Light red background
    borderWidth: 2,
    borderColor: '#ef4444', // Red border
  },
  answerTextCorrect: {
    color: '#15803d', // Dark green text
  },
  answerTextIncorrect: {
    color: '#dc2626', // Dark red text
  },
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
  timeAnimationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  timeAnimation: {
    width: 300,
    height: 300,
  },
  opponentFinishContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  opponentFinishText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
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
  // Bottom Toolbar Styles
  bottomToolbar: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    flexDirection: 'row',
    gap: 15,
  },
  toolbarButton: {
    backgroundColor: '#374151',
    borderRadius: 12,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#000000',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // DrawPad Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawPadContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: height * 0.7,
    paddingTop: 20,
  },
  drawPadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingBottom: 20,
    backgroundColor: '#4f46e5',
    marginHorizontal: 20,
    borderRadius: 15,
    paddingVertical: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawPadTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 5,
  },
  drawPadCanvas: {
    flex: 1,
    margin: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  drawPadControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 15,
  },
  controlButton: {
    backgroundColor: '#6b7280',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  okControlButton: {
    backgroundColor: '#ec4899',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});