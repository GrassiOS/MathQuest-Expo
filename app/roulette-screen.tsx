import { FontAwesome5 } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGame } from '@/contexts/GameContext';
import { categories } from '../data/static/categories';
import { questions } from '../data/static/questions';
import { Category } from '../types/Category';
import { getRandomQuestionsByCategory } from '../utils/getRandomQuestions';

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
  
  const { gameState, setCategory, setQuestions } = useGame();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // Check if we're in online mode and auto-spin to predetermined category
  useEffect(() => {
    console.log('🎰 Roulette screen useEffect triggered');
    console.log('🎰 categoryId:', categoryId);
    console.log('🎰 questionsParam:', questionsParam ? 'Present' : 'Missing');
    
    if (categoryId && questionsParam) {
      console.log('🎰 Setting online mode and auto-spinning');
      setIsOnlineMode(true);
      const targetCategory = categories[categoryId];
      if (targetCategory) {
        console.log('🎰 Target category found:', targetCategory.displayName);
        // Auto-spin to the predetermined category after a short delay
        setTimeout(() => {
          console.log('🎰 Starting auto-spin to category');
          spinToCategory(targetCategory);
        }, 1000);
      } else {
        console.error('🎰 Category not found for ID:', categoryId);
      }
    } else {
      console.log('🎰 Offline mode - no auto-spin');
    }
  }, [categoryId, questionsParam]);

  const spinToCategory = (targetCategory: Category) => {
    console.log('🎰 spinToCategory called for:', targetCategory.displayName);
    console.log('🎰 isSpinning:', isSpinning);
    
    if (isSpinning) {
      console.log('🎰 Already spinning, returning');
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
      
      if (isOnlineMode && questionsParam) {
        console.log('🎰 Using online mode questions');
        // Use questions from WebSocket for online mode
        const parsedQuestions = JSON.parse(questionsParam);
        setQuestions(parsedQuestions);
      } else {
        console.log('🎰 Using offline mode questions');
        // Generate random questions for offline mode
        const categoryQuestions = getRandomQuestionsByCategory(targetCategory.id, questions);
        setQuestions(categoryQuestions);
      }

      // Navigate to quiz screen after delay
      console.log('🎰 Setting up navigation to quiz screen in 2 seconds');
      setTimeout(() => {
        console.log('🎰 Navigating to quiz screen');
        router.push({
          pathname: '/quiz-screen',
          params: {
            categoryId: targetCategory.id,
            bgColor1,
            bgColor2,
            questions: JSON.stringify(isOnlineMode && questionsParam ? JSON.parse(questionsParam) : getRandomQuestionsByCategory(targetCategory.id, questions))
          }
        });
      }, 2000);
    });
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
        <LinearGradient
          colors={[bgColor1, bgColor2]}
          style={styles.gradientBackground}
        />
      
      {/* Competitive Header */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.competitiveHeader}>
          <View style={styles.playerSection}>
            <View style={styles.playerRow}>
              <Text style={styles.avatarEmoji}>{USER_1.avatar}</Text>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>{USER_1.name}</Text>
                <Text style={[styles.playerScore, { fontFamily: 'Digitalt' }]}>{USER_1.score.toString().padStart(2, '0')}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.playerSection}>
            <View style={styles.playerRow}>
              <Text style={styles.avatarEmoji}>{USER_2.avatar}</Text>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>{USER_2.name}</Text>
                <Text style={[styles.playerScore, { fontFamily: 'Digitalt' }]}>{USER_2.score.toString().padStart(2, '0')}</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Main Content */}
      <View style={styles.mainContent}>

        {/* Roulette Container */}
        <View style={styles.rouletteContainer}>
          {/* Roulette Wheel */}
          <Animated.View style={[
            styles.rouletteWheel,
            { transform: [{ rotate: spin }] }
          ]}>
            <Image
              source={require('../assets/images/competitive/1v1_roulette.png')}
              style={styles.rouletteImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Center Circle with Lightbulb */}
          <View style={styles.centerCircle}>
            <FontAwesome5 name="lightbulb" size={20} color="#000" />
          </View>

          {/* Pointer */}
          <View style={styles.pointer}>
            <View style={styles.pointerCircle} />
          </View>
        </View>

        {/* Selected Category Display */}
        {selectedCategory && (
          <View style={[
            styles.selectedCategoryContainer,
            { backgroundColor: selectedCategory.bgColor1 }
          ]}>
            <Text style={[styles.selectedCategoryText, { fontFamily: 'Digitalt' }]}>
              ¡{selectedCategory.displayName.toUpperCase()}!
            </Text>
          </View>
        )}

        {/* Spin Button - Only show in offline mode */}
        {!isOnlineMode && (
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <TouchableOpacity
              onPress={spinRoulette}
              disabled={isSpinning}
              style={styles.spinButtonContainer}
            >
              <LinearGradient
                colors={isSpinning ? ['#999', '#666'] : ['#FFD616', '#F65D00']}
                style={styles.spinButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[styles.spinButtonText, { fontFamily: 'Gilroy-Black' }]}>
                  {isSpinning ? 'Girando...' : 'Listo?'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  competitiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 10,
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
    paddingTop: 140,
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
