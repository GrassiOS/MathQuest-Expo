import { FontAwesome5 } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const USER_1 = {
  name: 'GRASSYOG',
  score: 1,
  avatar: 'G',
};

export default function PlayScreen() {
  const [fontsLoaded] = useFonts({
    Digitalt: require('../../assets/fonts/Digitalt.otf'),
    'Gilroy-Black': require('../../assets/fonts/Gilroy-Black.ttf'),
  });

  const handleStartGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/matchmaking-screen');
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a0b3d', '#6b46c1']}
        style={styles.gradientBackground}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>
            MATHQUEST
          </Text>
          <Text style={[styles.subtitle, { fontFamily: 'Gilroy-Black' }]}>
            Ready to challenge yourself?
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* User Info */}
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Text style={[styles.avatarText, { fontFamily: 'Digitalt' }]}>
                  {USER_1.avatar}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { fontFamily: 'Digitalt' }]}>
                  {USER_1.name}
                </Text>
                <View style={styles.scoreContainer}>
                  <FontAwesome5 name="trophy" size={16} color="#FFD616" />
                  <Text style={[styles.userScore, { fontFamily: 'Digitalt' }]}>
                    {USER_1.score}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Play Button */}
          <TouchableOpacity
            onPress={handleStartGame}
            style={styles.playButtonContainer}
          >
            <LinearGradient
              colors={['#FFD616', '#F65D00']}
              style={styles.playButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesome5 name="play" size={32} color="#fff" />
              <Text style={[styles.playButtonText, { fontFamily: 'Gilroy-Black' }]}>
                START GAME
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Game Mode Info */}
          <View style={styles.gameModeContainer}>
            <View style={styles.gameModeItem}>
              <FontAwesome5 name="users" size={20} color="#fff" />
              <Text style={[styles.gameModeText, { fontFamily: 'Digitalt' }]}>
                1v1 Competitive
              </Text>
            </View>
            <View style={styles.gameModeItem}>
              <FontAwesome5 name="clock" size={20} color="#fff" />
              <Text style={[styles.gameModeText, { fontFamily: 'Digitalt' }]}>
                Quick Match
              </Text>
            </View>
            <View style={styles.gameModeItem}>
              <FontAwesome5 name="brain" size={20} color="#fff" />
              <Text style={[styles.gameModeText, { fontFamily: 'Digitalt' }]}>
                Math Challenge
              </Text>
            </View>
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
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 10,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 16,
    letterSpacing: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  userSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4f46e5',
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
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  userScore: {
    color: '#FFD616',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playButtonContainer: {
    borderRadius: 35,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
    paddingVertical: 25,
    borderRadius: 35,
    gap: 15,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  gameModeContainer: {
    alignItems: 'center',
    gap: 15,
  },
  gameModeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 200,
  },
  gameModeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
