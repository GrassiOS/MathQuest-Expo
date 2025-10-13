import { FontAwesome5 } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TextInput,
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

const { height } = Dimensions.get('window');

type GameMode = 1 | 3 | 5; // minutes

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

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
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
    generateNewQuestion();
    startTimer();
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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

    if (isCorrect) {
      // Correct answer
      setScore(prev => prev + 1);
      setQuestionsAnswered(prev => prev + 1);
      
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
      setQuestionsAnswered(prev => prev + 1);

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

    // Calculate accuracy
    const accuracy = questionsAnswered > 0 ? (score / questionsAnswered) * 100 : 0;

    // Save high score
    if (gameMode && score > 0) {
      await addHighScore({
        mode: gameMode,
        score,
        accuracy,
        questionsAnswered,
      });
    }

    // Show game over alert
    Alert.alert(
      '¡Juego Terminado!',
      `Puntuación: ${score}\nRespuestas correctas: ${score}/${questionsAnswered}\nPrecisión: ${accuracy.toFixed(1)}%`,
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

        {/* Question area */}
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

        {/* Answer input */}
        <View style={styles.answerContainer}>
          <TextInput
            style={[styles.answerInput, { fontFamily: 'Digitalt' }]}
            value={userAnswer}
            onChangeText={setUserAnswer}
            placeholder="Tu respuesta..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            keyboardType="numeric"
            autoFocus={true}
            onSubmitEditing={checkAnswer}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.submitButton}
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
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  questionBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 30,
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
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  answerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 16,
  },
  answerInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  submitButton: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
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
