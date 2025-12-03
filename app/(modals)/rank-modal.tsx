import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Medal, X } from 'phosphor-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AnimatedMathBackground from '@/components/ui/AnimatedMathBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useFontContext } from '@/contexts/FontsContext';
import { getAllRanks, getUserRankInfo, RankRow, UserRankInfo } from '@/services/SupabaseService';

export default function RankModal() {
  const { user } = useAuth();
  const { fontsLoaded } = useFontContext();
  const [ranks, setRanks] = useState<RankRow[]>([]);
  const [rankInfo, setRankInfo] = useState<UserRankInfo | null>(null);
  const [loadingRanks, setLoadingRanks] = useState<boolean>(false);
  const [loadingUserRank, setLoadingUserRank] = useState<boolean>(false);
  const loading = loadingRanks || loadingUserRank;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingRanks(true);
      setLoadingUserRank(true);
      try {
        const [r, u] = await Promise.all([
          getAllRanks(),
          user?.id ? getUserRankInfo(user.id) : Promise.resolve(null),
        ]);
        if (mounted) {
          setRanks(Array.isArray(r) ? r : []);
          setRankInfo(u ?? null);
        }
      } finally {
        if (mounted) {
          setLoadingRanks(false);
          setLoadingUserRank(false);
        }
      }
    };
    load();
    return () => { mounted = false; };
  }, [user?.id]);

  const currentRankId = rankInfo?.rank?.id ?? null;
  const currentIndex = useMemo(() => {
    const idx = ranks.findIndex(r => r.id === currentRankId);
    return idx < 0 ? Number.MAX_SAFE_INTEGER : idx;
  }, [ranks, currentRankId]);

  const rankColor = useMemo(() => {
    return rankInfo?.rank?.color || '#A855F7';
  }, [rankInfo?.rank?.color]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[rankColor, '#8A56FE']} style={StyleSheet.absoluteFill} />
      <AnimatedMathBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>TU RANGO</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
            <X size={24} color="#FFFFFF" weight="bold" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { fontFamily: 'Gilroy-Black' }]}>
          {loading ? 'Cargando…' : rankInfo?.rank?.name ?? 'Sin rango'} • {rankInfo?.points ?? 0} pts
        </Text>

        <View style={styles.listWrap}>
          <FlatList
            data={ranks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => {
              const isCurrent = item.id === currentRankId;
              const isHigher = index > currentIndex;
              const dimStyle = isHigher ? { opacity: 0.35 } : null;
              return (
                <View style={[styles.rankCardOuter, isCurrent && styles.rankCardOuterActive]}>
                  <View style={[styles.rankCard, dimStyle]}>
                    <View style={[styles.iconBadge, { backgroundColor: 'rgba(255,255,255,0.10)' }]}>
                      {item.icon_url ? (
                        <Image source={{ uri: item.icon_url }} style={styles.rankIcon} resizeMode="contain" />
                      ) : (
                        <Medal size={28} color="#FFFFFF" weight="fill" />
                      )}
                    </View>
                    <View style={styles.rankTextCol}>
                      <Text
                        style={[
                          styles.rankName,
                          { fontFamily: 'Digitalt', color: isCurrent ? (item.color || '#FFFFFF') : '#FFFFFF' },
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text style={[styles.rankRange, { fontFamily: 'Gilroy-Black' }]}>
                        {item.min_points} - {item.max_points} pts
                      </Text>
                    </View>
                    {isCurrent ? (
                      <View style={[styles.currentPill, { borderColor: item.color || '#FFD45E' }]}>
                        <Text style={styles.currentPillText}>ACTUAL</Text>
                      </View>
                    ) : <View style={styles.pillSpacer} />}
                  </View>
                </View>
              );
            }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 18 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 6,
  },
  listWrap: { flex: 1, marginTop: 16 },
  listContent: { paddingBottom: 24, gap: 12 },
  rankCardOuter: {
    borderRadius: 16,
    padding: 2,
  },
  rankCardOuterActive: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  rankCard: {
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.20)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankIcon: { width: 32, height: 32 },
  rankTextCol: { flex: 1, minWidth: 0 },
  rankName: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  rankRange: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  currentPill: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  currentPillText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1,
  },
  pillSpacer: { width: 1, height: 1 },
});


