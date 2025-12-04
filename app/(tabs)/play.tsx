import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AnimatedMathBackground from '@/components/ui/AnimatedMathBackground';
import GameModeButton from '@/components/ui/GameModeButton';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatar } from '@/contexts/AvatarContext';
import { useFontContext } from '@/contexts/FontsContext';
import { getAllRanks, getUserRankInfo, UserRankInfo } from '@/services/SupabaseService';

const { height } = Dimensions.get('window');

const USER_1 = {
  name: 'GRASSYOG',
  score: 1,
  avatar: 'G',
};

export default function PlayScreen() {
  const { fontsLoaded } = useFontContext();

  const { avatar: userAvatar } = useAvatar();
  const { user } = useAuth();
  const [rankInfo, setRankInfo] = useState<UserRankInfo | null>(null);
  const [rankLoading, setRankLoading] = useState<boolean>(false);

  const refreshUserRank = useCallback(async () => {
    if (!user?.id) {
      setRankInfo(null);
      return;
    }
    setRankLoading(true);
    try {
      const remote = await getUserRankInfo(user.id);
      setRankInfo(remote ?? null);
    } finally {
      setRankLoading(false);
    }
  }, [user?.id]);

  const refreshRanks = useCallback(async () => {
    try {
      await getAllRanks();
    } catch {
      // ignore
    }
  }, []);

  const rankColor = useMemo(() => {
    const color = rankInfo?.rank?.color || '#A855F7';
    // Ensure color is a hex or valid CSS color, else fallback
    return color || '#A855F7';
  }, [rankInfo]);

  // Force refresh rank data whenever this screen gains focus (e.g., after a match)
  useFocusEffect(
    React.useCallback(() => {
      // Bypass cache to ensure latest ELO/Rank
      refreshUserRank();
      refreshRanks();
      return undefined;
    }, [refreshUserRank, refreshRanks])
  );

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
        colors={[rankColor, '#8A56FE']}
        style={styles.gradientBackground}
      />
      <AnimatedMathBackground />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>

        {/* Center title */}
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>COMPETITIVO</Text>
        </View>

        {/* Rank banner + progress */}
        <View style={styles.rankWrap}>
          <TouchableOpacity style={styles.rankBadge} activeOpacity={0.8} onPress={() => router.push('/(modals)/rank-modal')}>
            {rankInfo?.rank?.icon_url ? (
              <Image source={{ uri: rankInfo.rank.icon_url }} style={styles.rankIcon} resizeMode="contain" />
            ) : (
              <FontAwesome5 name="medal" size={22} color="#fff" />
            )}
            <Text style={[styles.rankName, { fontFamily: 'Digitalt' }]}>
              {rankLoading ? 'Cargando…' : (rankInfo?.rank?.name ?? 'Sin rango')}
            </Text>
            <Text style={[styles.rankPoints, { fontFamily: 'Gilroy-Black' }]}>
              {rankInfo?.points ?? 0} pts
            </Text>
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round((rankInfo?.progressPercent ?? 0) * 100)}%`, backgroundColor: rankColor },
              ]}
            />
          </View>
          <Text style={[styles.nextRankText, { fontFamily: 'Gilroy-Black' }]}>
            {rankLoading
              ? 'Calculando siguiente rango…'
              : rankInfo?.nextRank
                ? `Siguiente: ${rankInfo.nextRank.name} • Faltan ${rankInfo.pointsToNext} pts`
                : 'Rango máximo alcanzado'}
          </Text>
        </View>



        {/* Game mode buttons */}
        <View style={styles.buttonsWrap}>

          <GameModeButton
            name="COMPETITIVO!"
            route="/(games)/matchmaking-screen"
            gradientColors={["#FF6A6A", "#FF3D3D"]}
            imagePath={require('@/assets/images/competitive/1v1_roulette.png')}
            onPress={() => router.push('/(games)/matchmaking-screen')}
          />
          {/* TODO: Add how to play button */}
          
        </View>
      </SafeAreaView>
      {/* Floating Leaderboard button to new screen */}
      <Link href="/(modals)/leaderboard" asChild>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            console.log('Leaderboard button pressed (play tab)');
          }}
        >
          <LinearGradient colors={["#FFD45E", "#FFA500"]} style={styles.fabGradient}>
            <FontAwesome5 name="trophy" size={18} color="#fff" />
            <Text style={styles.fabText}>Ranking</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Link>
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
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  rankWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 8,
    marginTop: height * 0.12,
  },
  rankBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  rankPoints: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  rankIcon: {
    width: 28,
    height: 28,
  },
  progressTrack: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  nextRankText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: 8,
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
  buttonsWrap: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 22,
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 120,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 8,
  },
  fabGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
  },
});
