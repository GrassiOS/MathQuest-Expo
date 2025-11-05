import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LayeredAvatar } from '@/components/LayeredAvatar';
import MatchEndView from '@/components/matchmaking/MatchEndView';
import MatchFoundView from '@/components/matchmaking/MatchFoundView';
import MatchmakingView from '@/components/matchmaking/MatchmakingView';
import QuizView from '@/components/matchmaking/QuizView';
import RouletteView from '@/components/matchmaking/RouletteView';
import RoundResultView from '@/components/matchmaking/RoundResultView';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatar } from '@/contexts/AvatarContext';
import { useFontContext } from '@/contexts/FontsContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import LottieView from 'lottie-react-native';

type GameState = 'MATCHMAKING' | 'MATCH_FOUND' | 'ROULETTE' | 'QUIZ' | 'ROUND_RESULT' | 'MATCH_END';

// Simple color helpers for gradient generation
function clamp(n: number, min = 0, max = 255) { return Math.min(max, Math.max(min, n)); }
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((x) => Number.isNaN(x))) return null;
  return { r, g, b };
}
function rgbToHex(r: number, g: number, b: number) {
  const toHex = (v: number) => clamp(Math.round(v)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function lighten(hex: string, amount = 0.2) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const { r, g, b } = rgb;
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}
function darken(hex: string, amount = 0.2) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const { r, g, b } = rgb;
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

// Map mascot names to their static Lottie requires (React Native requires static paths)
const MASCOT_IDLE_SOURCES: Record<string, any> = {
  Restin: require('@/assets/lotties/mascots/Restin/1v1_Idle.json'),
  Plusito: require('@/assets/lotties/mascots/Plusito/1v1_Idle.json'),
  Porfix: require('@/assets/lotties/mascots/Porfix/1v1_Idle.json'),
  Dividin: require('@/assets/lotties/mascots/Dividin/1v1_Idle.json'),
  Totalin: require('@/assets/lotties/mascots/Totalin/1v1_Idle.json'),
};

function getMascotIdleSource(mascotName?: string) {
  return (mascotName && MASCOT_IDLE_SOURCES[mascotName]) || require('@/assets/lotties/extras/Time-15.json');
}

export default function MatchmakingScreen() {
  const { fontsLoaded } = useFontContext();
  const { user } = useAuth();
  const { avatar } = useAvatar();
  const {
    isConnected,
    connectionError,
    findPlayer,
    cancelSearch,
    onPlayerFound,
    onQueueUpdate,
    onRoundStarted,
    onRoundFinished,
    onGameFinished,
    onAnswerResult,
    currentRoom,
    socketId,
    websocketService,
  } = useWebSocket();

  const [gameState, setGameState] = useState<GameState>('MATCHMAKING');
  const [queuePosition, setQueuePosition] = useState<number | undefined>();
  const [opponent, setOpponent] = useState<{ userId: string; username: string } | null>(null);
  const [gameData, setGameData] = useState<any>(null);
  const [isExitingMatchmaking, setIsExitingMatchmaking] = useState(false);
  const [isExitingMatchFound, setIsExitingMatchFound] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string; emoji: string; color: string } | undefined>(undefined);

  // Quiz state
  type Exercise = { id: string; question: string; answer: number; options?: number[]; category: string; startTime?: number };
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState<string>('');
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [myRoundScore, setMyRoundScore] = useState<number>(0);
  const [hasCompletedRound, setHasCompletedRound] = useState<boolean>(false);

  // Transition overlay state
  const [isTransitioningToQuiz, setIsTransitioningToQuiz] = useState<boolean>(false);
  const [isTransitioningFromQuiz, setIsTransitioningFromQuiz] = useState<boolean>(false);
  const [transitionBgColor, setTransitionBgColor] = useState<string>('#22D3EE');
  const circleScale = useMemo(() => new Animated.Value(0.1), []);
  const circleTranslateY = useMemo(() => new Animated.Value(0), []);
  const whiteScale = useMemo(() => new Animated.Value(0), []);
  const textOpacity = useMemo(() => new Animated.Value(0), []);
  const overlayTranslateY = useMemo(() => new Animated.Value(0), []);
  const bgOpacity = useMemo(() => new Animated.Value(0), []);
  const contentOpacity = useMemo(() => new Animated.Value(0), []);
  const contentTranslateY = useMemo(() => new Animated.Value(0), []);
  const bgTranslateY = useMemo(() => new Animated.Value(0), []);
  const { height, width } = Dimensions.get('window');
  const baseCircleSize = 160; // px
  const fillScale = Math.max(width, height) / (baseCircleSize * 0.08); // big enough to cover

  const myUserId = useMemo(() => user?.id ?? `guest_${Date.now()}`, [user?.id]);
  const myUsername = useMemo(() => (user?.username || user?.email || 'Jugador').toString(), [user?.username, user?.email]);

  // Setup listener for when a player is found
  useEffect(() => {
    onPlayerFound((data) => {
      setOpponent(data.opponent ?? null);
      if (data.selectedCategory) setSelectedCategory(data.selectedCategory);
      // Trigger exit animation in matchmaking view first
      setIsExitingMatchmaking(true);
      // Signal readiness to start the game so server can send exercises
      websocketService.emit('start-game', {
        roomId: data.roomId,
        userId: myUserId,
        username: myUsername,
      });
    });
  }, [onPlayerFound]);

  // Listen to queue position updates
  useEffect(() => {
    onQueueUpdate((pos) => setQueuePosition(pos));
  }, [onQueueUpdate]);

  // Listen to round started
  useEffect(() => {
    onRoundStarted((data) => {
      // Data shape documented in server/WEBSOCKET_MESSAGES.md
      setGameData(data);
      setSelectedCategory(data?.category);
      setExercises(Array.isArray(data?.exercises) ? data.exercises : []);
      setQuestionIndex(0);
      setAnswerText('');
      setMyRoundScore(0);
      setHasCompletedRound(false);
      setQuestionStartTime(Date.now());
      setGameState('ROULETTE');
    });
  }, [onRoundStarted]);

  // Listen to round finished → play exit transition from QUIZ
  useEffect(() => {
    onRoundFinished((data) => {
      setGameData(data);
      // Skip animated transition to results to preserve scoring/flow
      setIsTransitioningFromQuiz(false);
      setGameState('ROUND_RESULT');
    });
  }, [onRoundFinished]);

  // Listen to game finished → go to MATCH_END
  useEffect(() => {
    onGameFinished((data) => {
      setGameData(data);
      setGameState('MATCH_END');
    });
  }, [onGameFinished]);

  // Listen to per-answer result to advance locally
  useEffect(() => {
    onAnswerResult((result: { exerciseId: string; isCorrect: boolean; correctAnswer: number; currentScore?: number; totalExercises?: number }) => {
      if (typeof result?.currentScore === 'number') {
        setMyRoundScore(result.currentScore);
      }
      // Clear input; advancing now happens immediately on OK press
      setAnswerText('');
    });
  }, [onAnswerResult, exercises.length]);

  // Quiz helpers
  const handleDigit = (d: string) => {
    setAnswerText((prev) => (prev.length >= 8 ? prev : (prev === '0' ? d : prev + d)));
  };
  const handleClear = () => setAnswerText('');
  const handleOk = () => {
    const current = exercises[questionIndex];
    if (!current || !currentRoom) return;
    const parsed = Number(answerText);
    if (Number.isNaN(parsed)) return;
    const payload = {
      roomId: currentRoom,
      userId: myUserId,
      exerciseId: current.id,
      answer: parsed,
      responseTime: Date.now() - questionStartTime,
    };
    websocketService.emit('answer-exercise', payload);

    // Advance immediately to keep UX snappy; server result will update score
    setAnswerText('');
    setQuestionIndex((idx) => {
      const next = idx + 1;
      if (next >= exercises.length) {
        setHasCompletedRound(true);
        return Math.min(idx, Math.max(0, exercises.length - 1));
      } else {
        setQuestionStartTime(Date.now());
        return next;
      }
    });
  };

  // Helper animation utilities
  const runTiming = (value: Animated.Value, toValue: number, duration: number, extra: Partial<Animated.TimingAnimationConfig> = {}) =>
    new Promise<void>((resolve) => {
      Animated.timing(value, { toValue, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true, ...extra }).start(() => resolve());
    });
  const runParallel = (animations: Animated.CompositeAnimation[]) => new Promise<void>((resolve) => Animated.parallel(animations).start(() => resolve()));
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const startRouletteToQuizTransition = async () => {
    // Prepare overlay
    setIsTransitioningToQuiz(true);
    setTransitionBgColor(selectedCategory?.color || '#22D3EE');
    circleScale.setValue(0.1);
    circleTranslateY.setValue(height * 0.5); // start from bottom half
    whiteScale.setValue(0);
    textOpacity.setValue(0);
    overlayTranslateY.setValue(0);
    bgOpacity.setValue(0);
    contentOpacity.setValue(0);
    contentTranslateY.setValue(10);
    bgTranslateY.setValue(0);

    // 1) Circle rises and fills the screen
    await runParallel([
      Animated.timing(circleTranslateY, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(circleScale, { toValue: fillScale, duration: 1000, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.timing(bgOpacity, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ]);

    // 2) White center pulse + title/subtitle fade-in
    await runParallel([
      Animated.timing(whiteScale, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);

    // 3) Hold while Lottie plays
    await delay(3000);

    // 4) Fade-down content + move background slightly down
    await runParallel([
      Animated.timing(textOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: 30, duration: 300, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(bgTranslateY, { toValue: 40, duration: 300, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]);
    // 5) Switch content under the overlay, then mirror the entrance:
    //    fade the background while the main circle slides down and shrinks,
    //    revealing the QUIZ underneath.
    setGameState('QUIZ');
    setQuestionStartTime(Date.now());
    await runParallel([
      Animated.timing(circleTranslateY, { toValue: height * 0.9, duration: 600, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(circleScale, { toValue: 0.08, duration: 600, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(bgOpacity, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.timing(whiteScale, { toValue: 0, duration: 300, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]);

    // Cleanup
    setIsTransitioningToQuiz(false);
    bgOpacity.setValue(0);
    bgTranslateY.setValue(0);
    contentTranslateY.setValue(0);
    circleScale.setValue(0.1);
    circleTranslateY.setValue(0);
  };

  const startQuizToResultTransition = async () => {
    // Prepare overlay
    setIsTransitioningFromQuiz(true);
    setTransitionBgColor('#22C55E');
    circleScale.setValue(0.1);
    circleTranslateY.setValue(height * 0.5);
    whiteScale.setValue(0);
    textOpacity.setValue(0);
    overlayTranslateY.setValue(0);
    bgOpacity.setValue(0);
    contentOpacity.setValue(0);
    contentTranslateY.setValue(10);
    bgTranslateY.setValue(0);

    // 1) Circle rises and fills the screen
    await runParallel([
      Animated.timing(circleTranslateY, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(circleScale, { toValue: fillScale, duration: 1000, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.timing(bgOpacity, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ]);

    // 2) White center pulse + title/subtitle fade-in
    await runParallel([
      Animated.timing(whiteScale, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);

    // 3) Hold while Lottie plays
    await delay(3000);

    // 4) Fade-down content + move background slightly down
    await runParallel([
      Animated.timing(textOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: 30, duration: 300, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(bgTranslateY, { toValue: 40, duration: 300, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]);
    // 5) Switch content under the overlay, then slide overlay off-screen to reveal it
    setGameState('ROUND_RESULT');
    await runTiming(overlayTranslateY as Animated.Value, height, 500, { easing: Easing.inOut(Easing.cubic) });

    // Cleanup
    setIsTransitioningFromQuiz(false);
    bgOpacity.setValue(0);
    bgTranslateY.setValue(0);
    contentTranslateY.setValue(0);
  };

  // Auto-join matchmaking when connected
  useEffect(() => {
    if (isConnected) {
      findPlayer(myUserId, myUsername);
    }
  }, [isConnected, findPlayer, myUserId, myUsername]);

  const handleCancel = () => {
    cancelSearch(myUserId);
    router.back();
  };

  const handleExitMatchEnd = () => {
    // Close socket session for this match and exit
    websocketService.disconnect();
    router.back();
  };

  // When MATCH_FOUND appears, wait 5s then fade out and move to ROULETTE
  useEffect(() => {
    if (gameState === 'MATCH_FOUND') {
      const t = setTimeout(() => {
        setIsExitingMatchFound(true);
      }, 5000);
      return () => clearTimeout(t);
    } else {
      setIsExitingMatchFound(false);
    }
  }, [gameState]);

  // Render content based on game state
  function renderContent() {
    switch (gameState) {
      case 'MATCHMAKING':
        return (
          <MatchmakingView
            username={myUsername?.toUpperCase()}
            avatarComponent={<LayeredAvatar avatar={avatar} size={92} />}
            onCancel={handleCancel}
            position={queuePosition}
            isExiting={isExitingMatchmaking}
            onExitComplete={() => {
              setGameState('MATCH_FOUND');
              setIsExitingMatchmaking(false);
            }}
          />
        );
      case 'MATCH_FOUND':
        return (
          <MatchFoundView
            me={{ username: myUsername?.toUpperCase(), avatarComponent: <LayeredAvatar avatar={avatar} size={92} /> }}
            opponent={{ username: (opponent?.username || 'OPONENTE').toUpperCase(), avatarComponent: <LayeredAvatar avatar={avatar} size={92} /> }}
            isExiting={isExitingMatchFound}
            onExitComplete={() => {
              setGameState('ROULETTE');
            }}
          />
        );
      case 'ROULETTE':
        return (
          <RouletteView
            selectedCategory={selectedCategory}
            onSpinComplete={() => {
              // Ensure exercises are loaded before entering the quiz
              if (exercises.length >= 6) {
                startRouletteToQuizTransition();
              }
            }}
          />
        );
      case 'QUIZ':
        return (
          <QuizView
            roundNumber={gameData?.roundNumber || 1}
            category={selectedCategory}
            question={exercises[questionIndex]?.question ?? '...'}
            index={Math.min(questionIndex, exercises.length ? exercises.length - 1 : 0)}
            total={exercises.length || 6}
            answerText={answerText}
            localScore={myRoundScore}
            disabled={hasCompletedRound}
            onDigit={handleDigit}
            onClear={handleClear}
            onOk={handleOk}
          />
        );
      case 'ROUND_RESULT':
        return (
          <RoundResultView
            roundNumber={gameData?.roundNumber || 1}
            player1Username={gameData?.player1Username || 'P1'}
            player2Username={gameData?.player2Username || 'P2'}
            player1Score={gameData?.player1Score ?? 0}
            player2Score={gameData?.player2Score ?? 0}
            winner={gameData?.winner}
            mySocketId={socketId}
          />
        );
      case 'MATCH_END':
        return (
          <MatchEndView
            didWin={gameData?.winner ? gameData?.winner === socketId : false}
            player1Username={gameData?.player1Username || 'P1'}
            player2Username={gameData?.player2Username || 'P2'}
            player1TotalScore={gameData?.player1TotalScore ?? 0}
            player2TotalScore={gameData?.player2TotalScore ?? 0}
            pointsDelta={(gameData?.winner === socketId ? gameData?.globalPointsUpdate?.winner : gameData?.globalPointsUpdate?.loser) ?? 0}
            onExit={handleExitMatchEnd}
          />
        );
      default:
        return <View />;
    }
  }

  if (!fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#9C58FE", "#6F52FD"]} style={styles.gradientBackground} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        {connectionError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {connectionError}</Text>
            {!isConnected && (
              <Text style={styles.errorHint}>
                Check console logs for debugging info
              </Text>
            )}
          </View>
        )}
        {renderContent()}

        {(isTransitioningToQuiz || isTransitioningFromQuiz) && (
          <Animated.View
            pointerEvents="none"
            style={[styles.transitionOverlay, { transform: [{ translateY: overlayTranslateY }] }]}
          >
            {/* Background gradient crossfade for the transition */}
            <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: bgOpacity, transform: [{ translateY: bgTranslateY }] }}>
              <LinearGradient
                colors={[darken(transitionBgColor, 0.25), lighten(transitionBgColor, 0.1)]}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
            </Animated.View>

            {/* Rising circle that fills screen */}
            <Animated.View
              style={[
                styles.transitionCircle,
                {
                  backgroundColor: isTransitioningFromQuiz ? '#22C55E' : (selectedCategory?.color || '#22D3EE'),
                  transform: [
                    { translateY: circleTranslateY },
                    { scale: circleScale },
                  ],
                },
              ]}
            />

            {/* Center white pulse */}
            <Animated.View
              style={[
                styles.centerPulse,
                {
                  transform: [{ scale: whiteScale }],
                },
              ]}
            />

            {/* Title + subtitle */}
            <Animated.View style={[styles.centerTextContainer, { opacity: textOpacity, transform: [{ translateY: contentTranslateY }] }]}>
              <Text style={styles.centerTitle}>
                {isTransitioningFromQuiz ? 'RESULTADOS' : `ROUND ${gameData?.roundNumber || 1}`}
              </Text>
              <Text style={styles.centerSubtitle}>
                {isTransitioningFromQuiz ? '¡BUEN TRABAJO!' : (selectedCategory?.name || 'SUMAS!').toUpperCase()}
              </Text>
            </Animated.View>

            {/* Lottie animation in center */}
            <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}>
              <LottieView
                source={isTransitioningFromQuiz
                  ? require('@/assets/lotties/extras/Confetti_quick.json')
                  : getMascotIdleSource(selectedCategory?.emoji)}
                autoPlay
                loop={isTransitioningFromQuiz ? false : true}
                style={styles.centerLottie}
              />
            </Animated.View>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6D28D9' },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  errorText: {
    color: '#FFEEEE',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorHint: {
    color: '#FFCCCC',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  // Component styles moved into respective components
  transitionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitionCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: '15%',
  },
  centerPulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
  },
  centerTextContainer: {
    position: 'absolute',
    top: '28%',
    alignItems: 'center',
  },
  centerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  centerSubtitle: {
    marginTop: 6,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  centerLottie: {
    width: 160,
    height: 160,
  },
});


