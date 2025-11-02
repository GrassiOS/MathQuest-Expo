import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Fire,
  GameController,
  GearSix,
  Lightning,
  Lock,
  PencilSimple,
  Percent,
  SignOut,
} from 'phosphor-react-native';
import React from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LayeredAvatar } from '@/components/LayeredAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatar } from '@/contexts/AvatarContext';
import { useFontContext } from '@/contexts/FontsContext';

const { width, height } = Dimensions.get('window');

const USER_1 = {
  name: 'GRASSYOG',
  score: 1,
  avatar: 'G',
  level: 5,
  gamesPlayed: 23,
  winRate: 78,
};

export default function UserScreen() {
  const { fontsLoaded } = useFontContext();

  const { avatar: userAvatar } = useAvatar();
  const { user, signOut } = useAuth();

  const handleCustomizeAvatar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(modals)/avatar-customization-screen');
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/login' as any);
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            }
          },
        },
      ]
    );
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
        colors={['#6b46c1', '#6b46c1']}
        style={styles.gradientBackground}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>Perfil</Text>
            <TouchableOpacity style={styles.headerAction} activeOpacity={0.8}>
              <GearSix size={20} color="#fff" weight="bold" />
            </TouchableOpacity>
          </View>

          {/* User Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity 
                style={styles.avatarCircle}
                onPress={handleCustomizeAvatar}
                activeOpacity={0.8}
              >
                <LayeredAvatar 
                  avatar={userAvatar}
                  size={110}
                  style={styles.layeredAvatar}
                />
                <View style={styles.customizeOverlay}>
                  <PencilSimple size={16} color="#fff" weight="bold" />
                </View>
              </TouchableOpacity>
              <View style={styles.levelBadge}>
                <Text style={[styles.levelText, { fontFamily: 'Digitalt' }]}>
                  {USER_1.level}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.userName, { fontFamily: 'Digitalt' }]}>
              {user?.username || USER_1.name}
            </Text>
            <Text style={[styles.userEmail, { fontFamily: 'Gilroy-Black' }]}>
              {user?.email}
            </Text>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Gilroy-Black' }]}>
              Statistics
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <GameController size={24} color="#4f46e5" weight="bold" />
                <Text style={[styles.statNumber, { fontFamily: 'Digitalt' }]}>
                  {USER_1.gamesPlayed}
                </Text>
                <Text style={[styles.statLabel, { fontFamily: 'Gilroy-Black' }]}>
                  Games Played
                </Text>
              </View>
              
              <View style={styles.statCard}>
                <Percent size={24} color="#22c55e" weight="bold" />
                <Text style={[styles.statNumber, { fontFamily: 'Digitalt' }]}>
                  {USER_1.winRate}%
                </Text>
                <Text style={[styles.statLabel, { fontFamily: 'Gilroy-Black' }]}>
                  Win Rate
                </Text>
              </View>
            </View>
          </View>

          {/* Achievements Section */}
          <View style={styles.achievementsSection}>
            <Text style={[styles.sectionTitle, { fontFamily: 'Gilroy-Black' }]}>
              Achievements
            </Text>
            
            <View style={styles.achievementsList}>
              <View style={styles.achievementItem}>
                <View style={styles.achievementIcon}>
                  <Fire size={20} color="#f97316" weight="fill" />
                </View>
                <View style={styles.achievementContent}>
                  <Text style={[styles.achievementTitle, { fontFamily: 'Digitalt' }]}>
                    First Victory
                  </Text>
                  <Text style={[styles.achievementDesc, { fontFamily: 'Gilroy-Black' }]}>
                    Win your first match
                  </Text>
                </View>
              </View>
              
              <View style={styles.achievementItem}>
                <View style={styles.achievementIcon}>
                  <Lightning size={20} color="#eab308" weight="fill" />
                </View>
                <View style={styles.achievementContent}>
                  <Text style={[styles.achievementTitle, { fontFamily: 'Digitalt' }]}>
                    Speed Demon
                  </Text>
                  <Text style={[styles.achievementDesc, { fontFamily: 'Gilroy-Black' }]}>
                    Answer 5 questions in under 10 seconds
                  </Text>
                </View>
              </View>
              
              <View style={[styles.achievementItem, styles.achievementLocked]}>
                <View style={styles.achievementIcon}>
                  <Lock size={20} color="#6b7280" weight="fill" />
                </View>
                <View style={styles.achievementContent}>
                  <Text style={[styles.achievementTitle, styles.achievementTitleLocked, { fontFamily: 'Digitalt' }]}>
                    Math Master
                  </Text>
                  <Text style={[styles.achievementDesc, styles.achievementDescLocked, { fontFamily: 'Gilroy-Black' }]}>
                    Win 10 matches in a row
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Logout Section */}
          <View style={styles.logoutSection}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <SignOut size={20} color="#ef4444" weight="bold" />
              <Text style={[styles.logoutText, { fontFamily: 'Digitalt' }]}>
                CERRAR SESIÓN
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    position: 'relative',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerAction: {
    position: 'absolute',
    right: 24,
    top: 24,
    padding: 6,
    borderRadius: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    position: 'relative',
  },
  layeredAvatar: {
    borderRadius: 55,
  },
  customizeOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFD616',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: 'normal',
    marginBottom: 15,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  userScore: {
    color: '#FFD616',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsSection: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  statNumber: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
  },
  achievementsSection: {
    paddingHorizontal: 30,
    paddingBottom: 100, // Extra padding for tab bar
  },
  achievementsList: {
    gap: 15,
  },
  achievementItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    gap: 15,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  achievementTitleLocked: {
    color: '#9ca3af',
  },
  achievementDesc: {
    color: '#9ca3af',
    fontSize: 12,
  },
  achievementDescLocked: {
    color: '#6b7280',
  },
  logoutSection: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 15,
    padding: 15,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
