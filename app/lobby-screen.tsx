import { FontAwesome5 } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LayeredAvatar } from '@/components/LayeredAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatar } from '@/contexts/AvatarContext';
import { useWebSocket } from '@/hooks/useWebSocket';

const { width, height } = Dimensions.get('window');

export default function LobbyScreen() {
  const [fontsLoaded] = useFonts({
    Digitalt: require('../assets/fonts/Digitalt.otf'),
    'Gilroy-Black': require('../assets/fonts/Gilroy-Black.ttf'),
  });

  const { user } = useAuth();
  const { avatar: userAvatar } = useAvatar();
  const [countdown, setCountdown] = useState(0);
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const readyButtonScale = useRef(new Animated.Value(1)).current;

  // WebSocket connection
  const {
    isConnected,
    matchData,
    roundData,
    isPlayerReady,
    playerDisconnected,
    joinQueue,
    sendPlayerReady,
    disconnect
  } = useWebSocket(
    user?.id,
    user?.username || 'Player',
    userAvatar
  );

  // Pulse animation for ready button
  useEffect(() => {
    if (!isPlayerReady) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isPlayerReady]);

  // Auto-join queue when connected
  useEffect(() => {
    if (isConnected && !matchData) {
      joinQueue();
    }
  }, [isConnected, matchData, joinQueue]);

  // Handle ready button press
  const handleReadyPress = () => {
    console.log('🎮 Ready button pressed!');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.sequence([
      Animated.timing(readyButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(readyButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    sendPlayerReady();
  };

  // Debug matchData changes
  useEffect(() => {
    console.log('🎯 Lobby screen - matchData changed:', matchData);
  }, [matchData]);

  // Handle WebSocket events for game progression
  useEffect(() => {
    if (roundData) {
      console.log('🎯 Round category received, navigating to roulette screen');
      console.log('🎯 Category:', roundData.category);
      console.log('🎯 Questions count:', roundData.questions.length);
      
      // Navigate to roulette screen with the category data
      router.push({
        pathname: '/roulette-screen',
        params: {
          categoryId: roundData.category.id,
          bgColor1: '#8b5cf6',
          bgColor2: '#a855f7',
          questions: JSON.stringify(roundData.questions)
        }
      });
    }
  }, [roundData]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    disconnect();
    router.back();
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!matchData) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#7c3aed', '#a855f7']}
          style={styles.gradientBackground}
        />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <FontAwesome5 name="chevron-left" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontFamily: 'Digitalt' }]}>
              BUSCANDO PARTIDA...
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.searchingContainer}>
            <Animated.View style={[styles.searchingIcon, { transform: [{ scale: pulseAnim }] }]}>
              <FontAwesome5 name="search" size={60} color="#fff" />
            </Animated.View>
            <Text style={[styles.searchingText, { fontFamily: 'Digitalt' }]}>
              Buscando oponente...
            </Text>
            <Text style={[styles.searchingSubtext, { fontFamily: 'Gilroy-Black' }]}>
              {isConnected ? 'Conectado al servidor' : 'Conectando...'}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const currentPlayer = matchData.players.find(p => p.id === user?.id);
  const opponent = matchData.players.find(p => p.id !== user?.id);

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
            PARTIDA ENCONTRADA!
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Match Info */}
        <View style={styles.matchInfo}>
          <Text style={[styles.matchTitle, { fontFamily: 'Digitalt' }]}>
            Ronda {matchData.currentRound} de {matchData.maxRounds}
          </Text>
          <Text style={[styles.matchSubtitle, { fontFamily: 'Gilroy-Black' }]}>
            Mejor de {matchData.maxRounds}
          </Text>
        </View>

        {/* Players */}
        <View style={styles.playersContainer}>
          {/* Current Player */}
          <View style={styles.playerSection}>
            <View style={styles.playerCard}>
              <View style={styles.avatarContainer}>
                <LayeredAvatar 
                  avatar={userAvatar}
                  size={80}
                  style={styles.avatar}
                />
                {isPlayerReady && (
                  <View style={styles.readyIndicator}>
                    <FontAwesome5 name="check" size={16} color="#fff" />
                  </View>
                )}
              </View>
              <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>
                {currentPlayer?.username}
              </Text>
              <Text style={[styles.playerStatus, { fontFamily: 'Gilroy-Black' }]}>
                {isPlayerReady ? 'Listo' : 'Esperando...'}
              </Text>
            </View>
          </View>

          {/* VS Divider */}
          <View style={styles.vsSection}>
            <View style={styles.vsLine} />
            <View style={styles.vsCircle}>
              <Text style={[styles.vsText, { fontFamily: 'Digitalt' }]}>VS</Text>
            </View>
            <View style={styles.vsLine} />
          </View>

          {/* Opponent */}
          <View style={styles.playerSection}>
            <View style={styles.playerCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.opponentAvatar}>
                  <Text style={[styles.opponentAvatarText, { fontFamily: 'Digitalt' }]}>
                    {opponent?.avatar?.skin_asset?.charAt(0) || 'O'}
                  </Text>
                </View>
                {playerDisconnected && (
                  <View style={styles.disconnectedIndicator}>
                    <FontAwesome5 name="exclamation-triangle" size={16} color="#fff" />
                  </View>
                )}
              </View>
              <Text style={[styles.playerName, { fontFamily: 'Digitalt' }]}>
                {opponent?.username}
              </Text>
              <Text style={[styles.playerStatus, { fontFamily: 'Gilroy-Black' }]}>
                {playerDisconnected ? 'Desconectado' : 'Preparándose...'}
              </Text>
            </View>
          </View>
        </View>

        {/* Ready Button */}
        {!isPlayerReady && (
          <View style={styles.readyButtonContainer}>
            <Animated.View style={{ transform: [{ scale: readyButtonScale }] }}>
              <TouchableOpacity 
                style={styles.readyButton}
                onPress={handleReadyPress}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={styles.readyButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <FontAwesome5 name="check" size={24} color="#fff" />
                  <Text style={[styles.readyButtonText, { fontFamily: 'Digitalt' }]}>
                    ESTOY LISTO!
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Waiting Message */}
        {isPlayerReady && (
          <View style={styles.waitingContainer}>
            <Animated.View style={[styles.waitingIcon, { transform: [{ scale: pulseAnim }] }]}>
              <FontAwesome5 name="clock" size={40} color="#fff" />
            </Animated.View>
            <Text style={[styles.waitingText, { fontFamily: 'Digitalt' }]}>
              Esperando al oponente...
            </Text>
          </View>
        )}
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

  // Searching State Styles
  searchingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  searchingIcon: {
    marginBottom: 30,
  },
  searchingText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  searchingSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
  },

  // Match Info Styles
  matchInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  matchTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  matchSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 5,
  },

  // Players Container Styles
  playersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  playerSection: {
    flex: 1,
    alignItems: 'center',
  },
  playerCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    width: '90%',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    borderRadius: 40,
  },
  opponentAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  opponentAvatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  readyIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  disconnectedIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  playerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  playerStatus: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },

  // VS Section Styles
  vsSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  vsLine: {
    height: 2,
    width: 60,
    backgroundColor: '#fff',
    marginVertical: 10,
  },
  vsCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    color: '#8b5cf6',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // Ready Button Styles
  readyButtonContainer: {
    paddingHorizontal: 40,
    paddingVertical: 30,
  },
  readyButton: {
    borderRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  readyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 30,
    gap: 15,
  },
  readyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  // Waiting Styles
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  waitingIcon: {
    marginBottom: 20,
  },
  waitingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
