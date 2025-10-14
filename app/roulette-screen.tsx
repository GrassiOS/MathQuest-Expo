import { LayeredAvatar } from '@/components/LayeredAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatar } from '@/contexts/AvatarContext';
import { useGame } from '@/contexts/GameContext';
import { useWebSocket } from '@/hooks/useWebSocket';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categories } from '../data/static/categories';
import { Category } from '../types/Category';


const { width, height } = Dimensions.get('window');

const USER_1 = {
  name: 'GRASSYOG',
  score: 1,
  avatar: 'G',
};
const USER_2 = {
  name: 'TESTUSER',
  score: 2,
  avatar: 'T',
};

// Convert categories to array for roulette
const categoryArray = Object.values(categories);
const ROULETTE_SIZE = 280;
const SEGMENT_ANGLE = 360 / categoryArray.length;

export default function RouletteScreen() {
  const [fontsLoaded] = useFonts({
    Digitalt: require('../assets/fonts/Digitalt.otf'),
    'Gilroy-Black': require('../assets/fonts/Gilroy-Black.ttf'),
  });

  const params = useLocalSearchParams();
  const categoryId = params.categoryId as string;
  const bgColor1 = params.bgColor1 as string || '#8b5cf6';
  const bgColor2 = params.bgColor2 as string || '#a855f7';
  const questionsParam = params.questions as string;
  const matchId = params.matchId as string;
  const matchDataParam = params.matchData as string;
  
  // Parse match data if available
  const matchData = matchDataParam ? JSON.parse(matchDataParam) : null;
  
  const { gameState, setCategory, setQuestions } = useGame();
  const { user } = useAuth();
  const { avatar: userAvatar } = useAvatar();
  
  // Get opponent data from match data
  const getOpponent = () => {
    if (!matchData || !user?.id) return null;
    
    const opponent = matchData.players.find((player: any) => player.id !== user.id);
    return opponent;
  };
  
  const opponent = getOpponent();
  
  // WebSocket connection for online mode
  const {
    isConnected,
    roundData,
    sendPlayerReady,
    sendMessage
  } = useWebSocket(
    user?.id,
    user?.username || 'Player',
    userAvatar
  );
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isOnlineModeState, setIsOnlineModeState] = useState(false);
  const [receivedCategory, setReceivedCategory] = useState<Category | null>(null);
  const [receivedQuestions, setReceivedQuestions] = useState<any[]>([]);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [bothPlayersReady, setBothPlayersReady] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // Check if we're in online mode and wait for both players to be ready
  useEffect(() => {
    console.log('🎰 Roulette screen useEffect triggered');
    console.log('🎰 categoryId:', categoryId);
    console.log('🎰 questionsParam:', questionsParam ? 'Present' : 'Missing');
    console.log('🎰 matchId:', matchId);
    console.log('🎰 matchData:', matchData ? 'Present' : 'Missing');
    
    console.log('🎰 Online mode - waiting for both players to be ready');
    setIsOnlineModeState(true);
    // Don't auto-spin yet, wait for both players to click "LISTO"
  }, [categoryId, questionsParam]);

  // Handle WebSocket ROUND_CATEGORY event (when server sends category and questions)
  useEffect(() => {
    if (roundData && !bothPlayersReady) {
      console.log('🎰 Received ROUND_CATEGORY from server:', roundData);
      
      // Ensure category has all required properties
      const serverCategory = roundData.category;
      const fullCategory: Category = {
        id: serverCategory.id,
        displayName: serverCategory.displayName,
        mascotName: serverCategory.mascotName,
        bgColor1: categories[serverCategory.id]?.bgColor1 || '#8b5cf6',
        bgColor2: categories[serverCategory.id]?.bgColor2 || '#a855f7'
      };
      
      setReceivedCategory(fullCategory);
      setReceivedQuestions(roundData.questions);
      setBothPlayersReady(true);
      
      console.log('🎰 Set receivedQuestions:', roundData.questions.length, 'questions');
      console.log('🎰 First question:', roundData.questions[0]);
      
      // Auto-spin to the category received from server
      setTimeout(() => {
        console.log('🎰 Starting auto-spin to server category');
        spinToCategory(fullCategory, roundData.questions);
      }, 2500);
    }
  }, [roundData, bothPlayersReady]);

  const spinToCategory = (targetCategory: Category, questionsToUse?: any[]) => {
    console.log('🎰 spinToCategory called for:', targetCategory.displayName);
    console.log('🎰 isSpinning:', isSpinning);
    console.log('🎰 receivedQuestions length:', receivedQuestions.length);
    console.log('🎰 questionsToUse length:', questionsToUse?.length || 0);
    
    if (isSpinning) {
      console.log('🎰 Already spinning, returning');
      return;
    }
    
    // Use passed questions or fallback to state
    const questions = questionsToUse || receivedQuestions;
    if (questions.length === 0) {
      console.log('🎰 No questions available, cannot spin');
      return;
    }

    const targetIndex = categoryArray.findIndex(cat => cat.id === targetCategory.id);
    console.log('🎰 Target index:', targetIndex);
    
    // Calculate target rotation
    const targetAngle = 360 - (targetIndex * SEGMENT_ANGLE) + (SEGMENT_ANGLE / 2);
    const spins = 5; // Number of full rotations
    const finalRotation = spins * 360 + targetAngle;
    console.log('🎰 Final rotation:', finalRotation);

    setIsSpinning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Roulette spin animation
    Animated.timing(rotateAnim, {
      toValue: finalRotation,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      console.log('🎰 Animation completed, setting selected category');
      setSelectedCategory(targetCategory);
      setIsSpinning(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Set up the game with the selected category and questions
      setCategory(targetCategory);
      
      if (receivedQuestions.length > 0) {
        console.log('🎰 Using questions from server');
        setQuestions(receivedQuestions);
      } else if (questionsParam) {
        console.log('🎰 Using questions from params');
        const parsedQuestions = JSON.parse(questionsParam);
        setQuestions(parsedQuestions);
      }

      // Navigate to quiz screen after delay
      console.log('🎰 Setting up navigation to quiz screen in 2 seconds');
      setTimeout(() => {
        console.log('🎰 Navigating to quiz screen');
        const questionsToPass = questions.length > 0 
          ? questions 
          : receivedQuestions.length > 0 
          ? receivedQuestions 
          : questionsParam 
          ? JSON.parse(questionsParam)
          : [];

        console.log('🎰 Roulette - questionsToPass length:', questionsToPass.length);
        console.log('🎰 Roulette - receivedQuestions length:', receivedQuestions.length);
        console.log('🎰 Roulette - receivedQuestions content:', receivedQuestions);
        console.log('🎰 Roulette - questionsParam:', questionsParam ? 'Present' : 'Missing');

        router.push({
          pathname: '/quiz-screen',
          params: {
            categoryId: targetCategory.id,
            bgColor1: targetCategory.bgColor1,
            bgColor2: targetCategory.bgColor2,
            questions: JSON.stringify(questionsToPass),
            matchId: matchId || '',
            matchData: matchData ? JSON.stringify(matchData) : ''
          }
        });
      }, 2000);
    });
  };

  const handleListoPress = () => {
    if (isSpinning || isPlayerReady) return;

    console.log('🎰 LISTO button pressed - sending PLAYER_READY');
    setIsPlayerReady(true);
    
    // Button animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Send player ready message to server
    if (sendMessage && matchData) {
      console.log('🎰 Sending PLAYER_READY with matchData:', matchData);
      sendMessage('PLAYER_READY', {
        matchId: matchData.matchId,
        playerId: user?.id
      });
    } else if (sendPlayerReady) {
      console.log('🎰 Using sendPlayerReady fallback');
      sendPlayerReady();
    }
  };

  const spinRoulette = () => {
    if (isSpinning) return;

    // For offline mode, use random category
    const targetCategory = categoryArray[Math.floor(Math.random() * categoryArray.length)];
    
    // Button animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    spinToCategory(targetCategory);
  };


  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const spin = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

   return (
    <View style={styles.container}>
      <LinearGradient colors={[bgColor1, bgColor2]} style={styles.gradientBackground} />
    {/* SafeArea wrapper for all visible content */}
    <SafeAreaView style={{ flex: 1 }}>
      {/* Competitive Header */}
      <View style={styles.headerContainer}>
        <View style={styles.competitiveHeader}>
          {/* Player 1 */}
          <View style={styles.playerSection}>
            <View style={styles.playerRow}>
              <View style={styles.avatarEmojiContainer}>
                <LayeredAvatar avatar={userAvatar} size={35} />
              </View>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>
                  {user?.username || USER_1.name}
                </Text>
                <Text style={[styles.playerScore, { fontFamily: 'Digitalt' }]}>
                  {USER_1.score.toString().padStart(2, '0')}
                </Text>
              </View>
            </View>
          </View>

          {/* Player 2 */}
          <View style={styles.playerSection}>
            <View style={styles.playerRow}>
              <View style={styles.avatarEmojiContainer}>
                <LayeredAvatar avatar={opponent?.avatar || userAvatar} size={35} />
              </View>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>
                  {opponent?.username || USER_2.name}
                </Text>
                <Text style={[styles.playerScore, { fontFamily: 'Digitalt' }]}>
                  {USER_2.score.toString().padStart(2, '0')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Roulette Container */}
        <View style={styles.rouletteContainer}>
          <Animated.View
            style={[styles.rouletteWheel, { transform: [{ rotate: spin }] }]}
          >
            <Image
              source={require('../assets/images/competitive/1v1_roulette.png')}
              style={styles.rouletteImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Center Circle */}
          <View style={styles.centerCircle}>
            <FontAwesome5 name="lightbulb" size={20} color="#000" />
          </View>

          {/* Pointer */}
          <View style={styles.pointer}>
            <View style={styles.pointerCircle} />
          </View>
        </View>

        {/* Selected Category */}
        {selectedCategory && (
          <View
            style={[
              styles.selectedCategoryContainer,
              { backgroundColor: selectedCategory.bgColor1 },
            ]}
          >
            <Text style={[styles.selectedCategoryText, { fontFamily: 'Digitalt' }]}>
              ¡{selectedCategory.displayName.toUpperCase()}!
            </Text>
          </View>
        )}

        {/* Spin Button */}
        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            onPress={handleListoPress}
            disabled={isSpinning || isPlayerReady}
            style={styles.spinButtonContainer}
          >
            <LinearGradient
              colors={
                isSpinning
                  ? ['#999', '#666']
                  : isPlayerReady
                  ? ['#4CAF50', '#45a049']
                  : ['#FFD616', '#F65D00']
              }
              style={styles.spinButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.spinButtonText, { fontFamily: 'Gilroy-Black' }]}>
                {isSpinning ? 'Girando...' : isPlayerReady ? '¡Listo!' : 'LISTO'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
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
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  safeAreaHeader: {
    backgroundColor: 'transparent',
  },
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
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingTop: 120, // Reduced to move content up
    justifyContent: 'space-around',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 20,
  },
  rouletteContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rouletteWheel: {
    width: ROULETTE_SIZE,
    height: ROULETTE_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rouletteImage: {
    width: ROULETTE_SIZE,
    height: ROULETTE_SIZE,
  },
  centerCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8d7da',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  pointer: {
    position: 'absolute',
    bottom: -15,
    alignItems: 'center',
  },
  pointerCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ffd700',
    borderWidth: 3,
    borderColor: '#ff8c00',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  selectedCategoryContainer: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginVertical: 20,
  },
  selectedCategoryText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  spinButtonContainer: {
    borderRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  spinButton: {
    paddingHorizontal: 50,
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});
