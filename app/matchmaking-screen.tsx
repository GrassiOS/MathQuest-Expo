import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LayeredAvatar } from '@/components/LayeredAvatar';
import { useAvatar } from '@/contexts/AvatarContext';
import { useGame } from '@/contexts/GameContext';
import RouletteScreen from './roulette-screen';

const { width, height } = Dimensions.get('window');

const USER_1 = {
  name: 'GRASSYOG',
  score: 1,
  avatar: 'G',
};

const OPPONENT = {
  name: 'TESTUSER01341ZQ...',
  score: 3,
  avatar: 'T',
};

type MatchmakingState = 'searching' | 'found';

export default function MatchmakingScreen() {
  const [fontsLoaded] = useFonts({
    Digitalt: require('../assets/fonts/Digitalt.otf'),
    'Gilroy-Black': require('../assets/fonts/Gilroy-Black.ttf'),
  });

  const { avatar: userAvatar } = useAvatar();
  const { gameState, startNewGame, addPlayer, findOpponent } = useGame();
  const [state, setState] = useState<MatchmakingState>('searching');
  const [searchingDots, setSearchingDots] = useState('');

  // Animation refs
  const lupaOpacity = useRef(new Animated.Value(1)).current;
  const cancelOpacity = useRef(new Animated.Value(1)).current;
  const versusOpacity = useRef(new Animated.Value(0)).current;
  const versusScale = useRef(new Animated.Value(0.8)).current;
  const opponentSlideAnim = useRef(new Animated.Value(height)).current;
  const titleFadeAnim = useRef(new Animated.Value(1)).current;
  
  // Ambitious transition animations
  const elementsOpacity = useRef(new Animated.Value(1)).current;
  const purpleSlideUp = useRef(new Animated.Value(0)).current;
  const redSlideDown = useRef(new Animated.Value(0)).current;
  const rouletteOpacity = useRef(new Animated.Value(0)).current;
  
  // Store transition timeout in ref to prevent cleanup
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dots animation for searching
  useEffect(() => {
    if (state === 'searching') {
      const interval = setInterval(() => {
        setSearchingDots(prev => {
          if (prev === '') return '.';
          if (prev === '.') return '..';
          if (prev === '..') return '...';
          return '';
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [state]);

  // Initialize game and add user
  useEffect(() => {
    startNewGame();
    addPlayer({
      id: 'user',
      name: USER_1.name,
      avatar: userAvatar,
      isConnected: true,
    });
  }, []);

  // Main matchmaking flow
  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];

    if (state === 'searching') {
      console.log('🔍 Starting search phase');
      
      // Start finding opponent
      findOpponent();
      
      // Simulate search time (5-10 seconds)
      const searchTimeout = setTimeout(() => {
        console.log('✅ Search complete, transitioning to found state');
        
        // Start transition to found state
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        
        // Fade out title, fade in new title
        Animated.sequence([
          Animated.timing(titleFadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(titleFadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        // Fade out lupa and cancel button
        Animated.parallel([
          Animated.timing(lupaOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cancelOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();

        // After fade out, show versus screen
        setTimeout(() => {
          console.log('🎭 Changing state to found');
          setState('found');
          
          // Start with invisible state to prevent flash
          versusOpacity.setValue(0);
          versusScale.setValue(0.8);
          opponentSlideAnim.setValue(height);
          elementsOpacity.setValue(1); // Make sure elements are visible initially
          
          console.log('🎬 Starting found state animations');
          
          // Animate versus screen and opponent smoothly
          Animated.parallel([
            Animated.timing(versusOpacity, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.spring(versusScale, {
              toValue: 1,
              tension: 40,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(opponentSlideAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]).start(() => {
            console.log('✅ Found state animations complete');
            
            // Transition timer is now handled by separate useEffect
          });
        }, 600);
      }, Math.random() * 2000 + 3000); // 3-5 seconds (shortened for testing)

      timeouts.push(searchTimeout);
    }

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
    };
  }, [state]);

  // Separate effect to handle the ambitious transition
  useEffect(() => {
    if (state === 'found') {
      console.log('🎯 Found state detected, setting up transition timer');
      
      const timer = setTimeout(() => {
        console.log('⏰ Transition timer fired!');
        startAmbitiousTransition();
      }, 6000); // 6 seconds total (3 for animations + 3 for transition)
      
      return () => {
        console.log('🧹 Cleaning up transition timer');
        clearTimeout(timer);
      };
    }
  }, [state]);

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.dismiss();
  };

  const startAmbitiousTransition = () => {
    console.log('🚀 STARTING AMBITIOUS TRANSITION');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Step 1: Fade out avatars, usernames, and "PARTIDA ENCONTRADA"
    console.log('📱 Step 1: Fading out elements');
    Animated.timing(elementsOpacity, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      console.log('✅ Step 1 Complete: Elements faded out');
      
      // Step 2: Start showing roulette underneath
      console.log('📱 Step 2: Showing roulette underneath');
      rouletteOpacity.setValue(1);
      
      // Step 3: Slide purple section up and red section down
      console.log('📱 Step 3: Starting screen peel animation');
      Animated.parallel([
        Animated.timing(purpleSlideUp, {
          toValue: -height,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(redSlideDown, {
          toValue: height,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log('✅ Step 3 Complete: Screen peeled away');
        console.log('🎯 Navigating to roulette screen');
        
        // Transition complete - navigate to roulette
        router.push('/roulette-screen');
      });
    });
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (state === 'searching') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#7c3aed', '#a855f7']}
          style={styles.gradientBackground}
        />

        <SafeAreaView style={styles.safeArea}>
          {/* Title */}
          <Animated.View style={[styles.titleContainer, { opacity: titleFadeAnim }]}>
            <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>
              BUSCANDO{'\n'}OPONENTE{searchingDots}
            </Text>
          </Animated.View>

          {/* User Avatar with Fire Ring */}
          <View style={styles.userSection}>
            <View style={styles.avatarWithRing}>
              <View style={styles.fireRingStroke} />
              <View style={styles.robotAvatarContainer}>
                <LayeredAvatar 
                  avatar={userAvatar}
                  size={90}
                  style={styles.layeredAvatar}
                />
              </View>
            </View>
            <Text style={[styles.userName, { fontFamily: 'Digitalt' }]}>
              {USER_1.name}
            </Text>
          </View>

          {/* Magnifying Glass Lottie */}
          <Animated.View style={[styles.lupaContainer, { opacity: lupaOpacity }]}>
            <LottieView
              source={require('../assets/lotties/extras/lupa.json')}
              style={styles.lupaAnimation}
              autoPlay
              loop
            />
          </Animated.View>

          {/* Cancel Button */}
          <Animated.View style={[styles.cancelContainer, { opacity: cancelOpacity }]}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButtonContainer}>
              <LinearGradient
                colors={['#FFD616', '#F65D00']}
                style={styles.cancelButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[styles.cancelButtonText, { fontFamily: 'Digitalt' }]}>
                  Cancelar
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  // Found state
  return (
    <View style={[styles.container, { backgroundColor: '#8b5cf6' }]}>
      {/* Roulette Screen Underneath */}
      <Animated.View 
        style={[
          styles.rouletteUnderneath,
          { opacity: rouletteOpacity }
        ]}
      >
        <RouletteScreen />
      </Animated.View>

      {/* User Section - Purple */}
      <Animated.View 
        style={[
          styles.foundUserSection,
          { 
            opacity: versusOpacity,
            transform: [
              { scale: versusScale },
              { translateY: purpleSlideUp }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={['#8b5cf6', '#a855f7']}
          style={styles.foundUserGradient}
        >
          <Animated.View style={{ opacity: elementsOpacity }}>
            <Text style={[styles.foundTitle, { fontFamily: 'Digitalt' }]}>
              PARTIDA{'\n'}ENCONTRADA!
            </Text>
            
            <View style={styles.foundAvatarSection}>
              <View style={styles.avatarWithRing}>
                <View style={styles.fireRingStroke} />
                <View style={styles.robotAvatarContainer}>
                  <LayeredAvatar 
                    avatar={userAvatar}
                    size={90}
                    style={styles.layeredAvatar}
                  />
                </View>
              </View>
              <Text style={[styles.foundUserName, { fontFamily: 'Digitalt' }]}>
                {USER_1.name}
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* VS Divider */}
      <Animated.View 
        style={[
          styles.vsDividerContainer,
          { opacity: versusOpacity, transform: [{ scale: versusScale }] }
        ]}
      >
        <View style={styles.vsDividerLine} />
        <View style={styles.vsTextContainer}>
          <Text style={[styles.vsText, { fontFamily: 'Digitalt' }]}>VS</Text>
        </View>
      </Animated.View>

      {/* Opponent Section - Red */}
      <Animated.View 
        style={[
          styles.foundOpponentSection,
          { 
            opacity: versusOpacity,
            transform: [
              { 
                translateY: Animated.add(opponentSlideAnim, redSlideDown)
              }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={['#ef4444', '#dc2626']}
          style={styles.foundOpponentGradient}
        >
          <Animated.View style={{ opacity: elementsOpacity }}>
            <View style={styles.foundOpponentAvatarSection}>
              <View style={styles.opponentAvatarContainer}>
                <Text style={[styles.avatarText, { fontFamily: 'Digitalt' }]}>
                  {OPPONENT.avatar}
                </Text>
              </View>
              <Text style={[styles.foundOpponentName, { fontFamily: 'Digitalt' }]}>
                {OPPONENT.name}
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
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
  
  // Searching State Styles
  titleContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    lineHeight: 42,
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 80,
  },
  avatarWithRing: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  fireRingStroke: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#f97316',
    zIndex: 1,
  },
  robotAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    zIndex: 2,
  },
  layeredAvatar: {
    borderRadius: 45,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  lupaContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  lupaAnimation: {
    width: 120,
    height: 120,
  },
  cancelContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
  },
  cancelButtonContainer: {
    borderRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cancelButton: {
    paddingHorizontal: 50,
    paddingVertical: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  // Roulette Underneath
  rouletteUnderneath: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },

  // Found State Styles
  foundUserSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foundUserGradient: {
    flex: 1,
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  foundTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 40,
  },
  foundAvatarSection: {
    alignItems: 'center',
  },
  foundUserName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 20,
  },
  
  vsDividerContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    marginTop: -25,
  },
  vsDividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#fff',
    width: width,
  },
  vsTextContainer: {
    zIndex: 11,
  },
  vsText: {
    color: '#000',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  foundOpponentSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foundOpponentGradient: {
    flex: 1,
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  foundOpponentAvatarSection: {
    alignItems: 'center',
  },
  opponentAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  foundOpponentName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 20,
  },
});
