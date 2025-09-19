import { FontAwesome5 } from '@expo/vector-icons';
import DrawPad, { DrawPadHandle } from "expo-drawpad";
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { competitiveMascotAnimations } from '@/data/static/lotties';
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
  
  const category = categories[categoryId] || categories.resta;
  
  // Parse questions from params
  const questions: Question[] = questionsParam ? JSON.parse(questionsParam) : [];
  
  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [user1Score, setUser1Score] = useState(0);
  const [user2Score, setUser2Score] = useState(0);
  const [input, setInput] = useState('');
  const [showDrawPad, setShowDrawPad] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const drawPadRef = useRef<DrawPadHandle>(null);
  const currentQuestion = questions[currentQuestionIndex];
  const [fontsLoaded] = useFonts({
    Digitalt: require('../assets/fonts/Digitalt.otf'),
  });
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
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
      setUser1Score(prev => prev + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Auto advance after 2 seconds
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };
  
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setInput('');
      setIsAnswerCorrect(null);
      setShowResult(false);
    } else {
      // Quiz finished - could navigate to results screen
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      // For now, just reset to first question or navigate back
      router.back();
    }
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
    <View style={styles.container}>
      <LinearGradient
        colors={[bgColor1, bgColor2]}
        style={styles.gradientBackground}
      />
      
      {/* Competitive Header - Separate layer with safe area */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.competitiveHeader}>
          <View style={styles.playerSection}>
            <View style={styles.playerRow}>
              <Text style={styles.avatarEmoji}>{INITIAL_USER_1.avatar}</Text>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>{INITIAL_USER_1.name}</Text>
                <Text style={[styles.playerScore, { fontFamily: 'Digitalt' }]}>{user1Score.toString().padStart(2, '0')}</Text>
              </View>
            </View>
          </View>
          
          {/* Progress indicator */}
          <View style={styles.progressSection}>
            <Text style={[styles.progressText, { fontFamily: 'Digitalt' }]}>
              {currentQuestionIndex + 1}/{questions.length}
            </Text>
          </View>
          
          <View style={styles.playerSection}>
            <View style={styles.playerRow}>
              <Text style={styles.avatarEmoji}>{INITIAL_USER_2.avatar}</Text>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>{INITIAL_USER_2.name}</Text>
                <Text style={[styles.playerScore, { fontFamily: 'Digitalt' }]}>{user2Score.toString().padStart(2, '0')}</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

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
    </View>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingTop: 120, // Account for header space
  },
  // Competitive Header Styles
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