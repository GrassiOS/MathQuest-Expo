import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LayeredAvatar } from '@/components/LayeredAvatar';
import AnimatedMathBackground from '@/components/ui/AnimatedMathBackground';
import InfiniteGameModeButton from '@/components/ui/InfiniteGameModeButton';
import { useAvatar } from '@/contexts/AvatarContext';
import { useOfflineStorage } from '@/contexts/OfflineStorageContext';
import {
  generateQuestion,
  getDifficultyFromScore,
  getRandomCategory
} from '@/utils/generateQuestions';

const { width, height } = Dimensions.get('window');

// Mascot animations
const mascotAnimations = {
  suma: require('../assets/lotties/mascots/Plusito/1v1_Idle.json'),
  resta: require('../assets/lotties/mascots/Restin/1v1_Idle.json'),
  multiplicacion: require('../assets/lotties/mascots/Porfix/1v1_Idle.json'),
  division: require('../assets/lotties/mascots/Dividin/1v1_Idle.json'),
};

// Custom numpad layout
const NUMPAD = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  ['−', 0, '⌫'],
];

type GameMode = 0.5 | 1 | 3 | 5; // 0.5 = 30 seconds, others in minutes

export default function InfiniteGameScreen() {
  const [fontsLoaded] = useFonts({
    Digitalt: require('../assets/fonts/Digitalt.otf'),
    'Gilroy-Black': require('../assets/fonts/Gilroy-Black.ttf'),
  });

  const { avatar: userAvatar } = useAvatar();
  const { addHighScore, getTopScores } = useOfflineStorage();

  // Game state
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [answerHistory, setAnswerHistory] = useState<Array<{
    question: string;
    userAnswer: string;
    correctAnswer: number;
    isCorrect: boolean;
    timestamp: number;
  }>>([]);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs to track current score for endGame
  const scoreRef = useRef(0);
  const questionsAnsweredRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Save answer history to AsyncStorage
  const saveAnswerHistory = async (history: typeof answerHistory) => {
    try {
      await AsyncStorage.setItem('infiniteGameAnswerHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving answer history:', error);
    }
  };

  // Load answer history from AsyncStorage
  useEffect(() => {
    const loadAnswerHistory = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem('infiniteGameAnswerHistory');
        if (savedHistory) {
          setAnswerHistory(JSON.parse(savedHistory));
        }
      } catch (error) {
        console.error('Error loading answer history:', error);
      }
    };
    loadAnswerHistory();
  }, []);

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setTimeLeft(mode * 60); // Convert minutes to seconds
    setScore(0);
    setWrongAnswers(0);
    setQuestionsAnswered(0);
    setUserAnswer('');
    setGameEnded(false);
    setIsGameActive(true);
    
    // Reset refs
    scoreRef.current = 0;
    questionsAnsweredRef.current = 0;
    
    generateNewQuestion();
    startTimer();
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Use a small delay to ensure state updates are captured
          setTimeout(() => endGame(), 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as NodeJS.Timeout;
  };

  const generateNewQuestion = () => {
    const category = getRandomCategory();
    const difficulty = getDifficultyFromScore(score);
    const question = generateQuestion(category, difficulty);
    setCurrentQuestion(question);
    setUserAnswer('');
  };

  const checkAnswer = () => {
    if (!currentQuestion || !userAnswer.trim()) return;

    const userNum = parseInt(userAnswer.trim());
    const isCorrect = userNum === currentQuestion.correctAnswer;

    // Save answer to history
    const newAnswer = {
      question: currentQuestion.question,
      userAnswer: userAnswer.trim(),
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      timestamp: Date.now(),
    };
    
    const updatedHistory = [...answerHistory, newAnswer];
    setAnswerHistory(updatedHistory);
    saveAnswerHistory(updatedHistory);

    if (isCorrect) {
      // Correct answer
      setScore(prev => {
        const newScore = prev + 1;
        scoreRef.current = newScore;
        return newScore;
      });
      setQuestionsAnswered(prev => {
        const newCount = prev + 1;
        questionsAnsweredRef.current = newCount;
        return newCount;
      });
      
      // Pulse animation for correct answer
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Generate new question after a short delay
      setTimeout(() => {
        generateNewQuestion();
      }, 500);
    } else {
      // Wrong answer
      setWrongAnswers(prev => prev + 1);
      setQuestionsAnswered(prev => {
        const newCount = prev + 1;
        questionsAnsweredRef.current = newCount;
        return newCount;
      });

      // Shake animation for wrong answer
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      Vibration.vibrate(200);

      // Check if game should end (3 wrong answers)
      if (wrongAnswers + 1 >= 3) {
        setTimeout(() => {
          endGame();
        }, 1000);
      } else {
        // Generate new question after delay
        setTimeout(() => {
          generateNewQuestion();
        }, 1000);
      }
    }
  };

  const endGame = async () => {
    setIsGameActive(false);
    setGameEnded(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Use refs to get the most current values
    const finalQuestionsAnswered = questionsAnsweredRef.current;
    const finalScore = scoreRef.current;
    const accuracy = finalQuestionsAnswered > 0 ? (finalScore / finalQuestionsAnswered) * 100 : 0;

    // Save high score
    if (gameMode && finalScore > 0) {
      await addHighScore({
        mode: gameMode,
        score: finalScore,
        accuracy,
        questionsAnswered: finalQuestionsAnswered,
      });
    }

    // Show game over alert
    Alert.alert(
      '¡Juego Terminado!',
      `Puntuación: ${finalScore}\nRespuestas correctas: ${finalScore}/${finalQuestionsAnswered}\nPrecisión: ${accuracy.toFixed(1)}%`,
      [
        {
          text: 'Jugar de Nuevo',
          onPress: () => {
            setGameMode(null);
            setGameEnded(false);
          }
        },
        {
          text: 'Volver al Menú',
          onPress: () => router.back()
        }
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNumpadPress = (val: string | number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (val === '⌫') {
      // Backspace
      setUserAnswer(prev => prev.slice(0, -1));
    } else if (val === '−') {
      // Toggle negative sign
      setUserAnswer(prev => {
        if (prev.startsWith('-')) {
          return prev.slice(1);
        } else if (prev === '') {
          return '-';
        } else {
          return '-' + prev;
        }
      });
    } else {
      // Number key
      setUserAnswer(prev => prev + val);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Mode selection screen
  if (!gameMode) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#5B9FED', '#31C45A']}
          style={styles.gradientBackground}
        />
        <AnimatedMathBackground />

        <SafeAreaView style={styles.safeArea}>
          {/* Back button for mode selection */}
          <TouchableOpacity 
            style={styles.modeSelectionBackButton}
            onPress={() => router.back()}
          >
            <FontAwesome5 name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>

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
            <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>MODO INFINITO</Text>
            <Text style={[styles.subtitle, { fontFamily: 'Gilroy-Black' }]}>
              Responde tantas preguntas como puedas antes de que se acabe el tiempo o cometas 3 errores
            </Text>
          </View>

          {/* Mode selection buttons */}
          <View style={styles.modeButtonsWrap}>
            <InfiniteGameModeButton
              name="30 SEGUNDOS"
              route="/infinite-game"
              gradientColors={['#FF6B9D', '#C44569']}
              highScore={getTopScores(0.5, 1)[0]?.score || 0}
              date={getTopScores(0.5, 1)[0] ? new Date(getTopScores(0.5, 1)[0].timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Sin puntuación'}
              onPress={() => startGame(0.5)}
            />

            <InfiniteGameModeButton
              name="1 MINUTO"
              route="/infinite-game"
              gradientColors={['#FFA65A', '#FF5EA3']}
              highScore={getTopScores(1, 1)[0]?.score || 0}
              date={getTopScores(1, 1)[0] ? new Date(getTopScores(1, 1)[0].timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Sin puntuación'}
              onPress={() => startGame(1)}
            />

            <InfiniteGameModeButton
              name="3 MINUTOS"
              route="/infinite-game"
              gradientColors={['#8EF06E', '#31C45A']}
              highScore={getTopScores(3, 1)[0]?.score || 0}
              date={getTopScores(3, 1)[0] ? new Date(getTopScores(3, 1)[0].timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Sin puntuación'}
              onPress={() => startGame(3)}
            />

            <InfiniteGameModeButton
              name="5 MINUTOS"
              route="/infinite-game"
              gradientColors={['#6CCBFF', '#5B9FED']}
              highScore={getTopScores(5, 1)[0]?.score || 0}
              date={getTopScores(5, 1)[0] ? new Date(getTopScores(5, 1)[0].timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Sin puntuación'}
              onPress={() => startGame(5)}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Game screen
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#A855F7', '#7C3AED']}
        style={styles.gradientBackground}
      />
      <AnimatedMathBackground />

      <SafeAreaView style={styles.safeArea}>
        {/* Top bar with timer and score */}
        <View style={styles.gameTopBar}>
          {/* Back button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (timerRef.current) {
                clearInterval(timerRef.current);
              }
              // Go back to mode selection screen
              setGameMode(null);
              setScore(0);
              setWrongAnswers(0);
              setQuestionsAnswered(0);
              setUserAnswer('');
              setIsGameActive(false);
              setGameEnded(false);
              scoreRef.current = 0;
              questionsAnsweredRef.current = 0;
            }}
          >
            <FontAwesome5 name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { fontFamily: 'Digitalt' }]}>TIEMPO</Text>
              <Text style={[styles.statValue, { fontFamily: 'Digitalt' }]}>{formatTime(timeLeft)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { fontFamily: 'Digitalt' }]}>PUNTOS</Text>
              <Text style={[styles.statValue, { fontFamily: 'Digitalt' }]}>{score}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { fontFamily: 'Digitalt' }]}>ERRORES</Text>
              <Text style={[styles.statValue, { fontFamily: 'Digitalt' }]}>{wrongAnswers}/3</Text>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Question area with mascots on top */}
          <View style={styles.questionAreaWrapper}>
            {/* Mascot animations row - positioned on top of card */}
            <View style={styles.mascotsRow}>
              {Object.entries(mascotAnimations).map(([key, animation]) => (
                <View key={key} style={styles.mascotWrapper}>
                  <LottieView
                    source={animation}
                    autoPlay
                    loop
                    style={styles.mascotAnimation}
                  />
                </View>
              ))}
            </View>

            {/* Question card */}
            <View style={styles.questionContainer}>
              {currentQuestion && (
                <Animated.View style={[
                  styles.questionBox,
                  { 
                    transform: [
                      { scale: pulseAnim },
                      { translateX: shakeAnim }
                    ]
                  }
                ]}>
                  <Text style={[styles.categoryText, { fontFamily: 'Digitalt' }]}>
                    {currentQuestion.category}
                  </Text>
                  <Text style={[styles.questionText, { fontFamily: 'Digitalt' }]}>
                    {currentQuestion.question}
                  </Text>
                </Animated.View>
              )}
            </View>
          </View>

          {/* Answer Display */}
          <Animated.View style={[
            styles.answerDisplay,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <Text style={[
              styles.answerText,
              userAnswer === '' && styles.answerTextEmpty,
              { fontFamily: 'Digitalt' }
            ]}>
              {userAnswer || '0'}
            </Text>
          </Animated.View>

          {/* Custom Numpad */}
          <View style={styles.numpadContainer}>
            {NUMPAD.map((row, i) => (
              <View key={i} style={styles.numpadRow}>
                {row.map((val, j) => (
                  <TouchableOpacity
                    key={j}
                    style={styles.numpadButton}
                    onPress={() => handleNumpadPress(val)}
                  >
                    <Text style={[styles.numpadButtonText, { fontFamily: 'Digitalt' }]}>
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, !userAnswer.trim() && styles.submitButtonDisabled]}
            onPress={checkAnswer}
            disabled={!userAnswer.trim()}
          >
            <LinearGradient
              colors={userAnswer.trim() ? ['#FFA65A', '#FF5EA3'] : ['#666', '#444']}
              style={styles.submitButtonGradient}
            >
              <Text style={[styles.submitButtonText, { fontFamily: 'Digitalt' }]}>
                ENVIAR
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
  modeSelectionBackButton: {
    position: 'absolute',
    top: 10,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
  backButton: {
    position: 'absolute',
    top: 15,
    left: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 20,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'normal',
    letterSpacing: 0.5,
    textAlign: 'center',
    opacity: 0.9,
    marginTop: 8,
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
  modeButtonsWrap: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
    justifyContent: 'center',
  },
  gameTopBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    position: 'relative',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    opacity: 0.8,
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 4,
  },
  questionAreaWrapper: {
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  mascotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    position: 'absolute',
    top: -30, // Position above the card
    left: 0,
    right: 0,
    zIndex: 10,
  },
  mascotWrapper: {
    width: width / 4 - 10,
    height: 85,
    marginHorizontal: 1,
  },
  mascotAnimation: {
    width: '100%',
    height: '100%',
  },
  questionContainer: {
    width: '100%',
    paddingTop: 45, // Space for mascots
  },
  questionBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryText: {
    color: '#FFD45E',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 16,
  },
  questionText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  answerDisplay: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: '85%',
    alignItems: 'center',
    marginVertical: 10,
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
  numpadContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 12,
  },
  numpadButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 26,
    width: 80,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  submitButton: {
    width: '85%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
