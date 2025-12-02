import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { getLeaderboard, LeaderboardEntry } from '@/services/SupabaseService';
import { FadeInView } from '@/components/shared/FadeInView';
import { LayeredAvatar } from '@/components/LayeredAvatar';

const { width } = Dimensions.get('window');

export default function LeaderboardModal() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  const currentUserId = user?.id ?? null;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getLeaderboard(100);
      setEntries(data);
      setLoading(false);
    };
    load();
  }, []);

  const topThree = useMemo(() => entries.slice(0, 3), [entries]);
  const others = useMemo(() => entries.slice(3), [entries]);

  // Loading screen with playful badge
  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#22C6A7', '#7B61FF']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.title}>CLASIFICACIÓN</Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={styles.loadingCenter}>
            <FadeInView from="bottom" distance={30} duration={700}>
              <View style={styles.loadingBadge}>
                <LinearGradient colors={['#FFD45E', '#FFA500']} style={styles.loadingBadgeGradient}>
                  <FontAwesome5 name="trophy" size={28} color="#fff" />
                </LinearGradient>
              </View>
            </FadeInView>
            <FadeInView delay={120}>
              <Text style={styles.loadingTitle}>Cargando clasificación…</Text>
            </FadeInView>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#22C6A7', '#7B61FF']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
          <Text style={styles.title}>CLASIFICACIÓN</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollInner}>
          {/* Podium */}
          <View style={styles.podiumWrap}>
            <FadeInView from="bottom" delay={50} distance={26}>
              <PodiumSpot
                place={2}
                entry={topThree[1]}
                highlight={topThree[1]?.id === currentUserId}
                style={{ alignSelf: 'flex-end' }}
              />
            </FadeInView>
            <FadeInView from="bottom" delay={140} distance={28}>
              <PodiumSpot
                place={1}
                entry={topThree[0]}
                highlight={topThree[0]?.id === currentUserId}
                style={{ alignSelf: 'center' }}
              />
            </FadeInView>
            <FadeInView from="bottom" delay={220} distance={30}>
              <PodiumSpot
                place={3}
                entry={topThree[2]}
                highlight={topThree[2]?.id === currentUserId}
                style={{ alignSelf: 'flex-start' }}
              />
            </FadeInView>
          </View>

          {/* Others list */}
          <View style={styles.listWrap}>
            {others.map((e, idx) => {
              const rank = idx + 4; // since others start at #4
              const isCurrent = e.id === currentUserId;
              return (
                <FadeInView key={e.id} from="right" delay={80 + idx * 40} distance={18}>
                  <View style={[styles.cardRow, isCurrent && styles.cardRowCurrent]}>
                    {e.avatar ? (
                      <View style={[styles.cardAvatarWrap, { backgroundColor: '#fff' }]}>
                        <LayeredAvatar avatar={e.avatar} size={42} />
                      </View>
                    ) : (
                      <LinearGradient colors={['#FFFFFF', 'rgba(255,255,255,0.8)']} style={styles.cardAvatarWrap}>
                        <Text style={[styles.initialText, { color: '#6C55F7' }]}>
                          {(e.username || 'U').slice(0, 1).toUpperCase()}
                        </Text>
                      </LinearGradient>
                    )}
                    <View style={styles.cardTextWrap}>
                      <Text style={[styles.username, isCurrent && styles.usernameCurrent]}>@{e.username}</Text>
                      <Text style={styles.pointsSmall}>({e.points})</Text>
                    </View>
                    <View style={[styles.rankPill, isCurrent && styles.rankPillCurrent]}>
                      <Text style={[styles.rankPillText, isCurrent && styles.rankPillTextCurrent]}>#{rank}</Text>
                    </View>
                  </View>
                </FadeInView>
              );
            })}
            {loading && (
              <Text style={styles.loadingText}>Cargando clasificación…</Text>
            )}
            {!loading && entries.length === 0 && (
              <Text style={styles.loadingText}>No hay datos de clasificación todavía.</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

type PodiumSpotProps = {
  place: 1 | 2 | 3;
  entry?: LeaderboardEntry;
  highlight?: boolean;
  style?: any;
};

function PodiumSpot({ place, entry, highlight, style }: PodiumSpotProps) {
  const heights = { 1: 160, 2: 110, 3: 90 } as const;
  const colors = {
    1: '#F8F32B', // yellow
    2: '#D8D8D8', // silver
    3: '#B38B6D', // bronze-ish
  } as const;
  return (
    <View style={[styles.spotWrap, style]}>
      <View style={styles.spotAvatarShadow}>
        {entry?.avatar ? (
          <View style={[styles.initialCircle, styles.spotAvatar, { backgroundColor: '#fff' }]}>
            <LayeredAvatar avatar={entry.avatar} size={72} />
          </View>
        ) : (
          <LinearGradient colors={['#FFFFFF', '#EDEBFF']} style={[styles.initialCircle, styles.spotAvatar]}>
            <Text style={[styles.initialText, { color: '#6C55F7', fontSize: 30 }]}>
              {(entry?.username || 'U').slice(0, 1).toUpperCase()}
            </Text>
          </LinearGradient>
        )}
      </View>
      <Text style={[styles.spotUsername, highlight && styles.usernameCurrent]}>
        @{entry?.username ?? '—'}
      </Text>
      <Text style={styles.spotPoints}>({entry?.points ?? 0})</Text>
      <View style={[styles.podiumBlock, { height: heights[place], backgroundColor: colors[place] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B1B1B',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 28,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  scrollInner: {
    paddingBottom: 32,
  },
  podiumWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  spotWrap: {
    alignItems: 'center',
    width: width / 3 - 16,
  },
  spotAvatar: {
    marginBottom: 8,
  },
  spotAvatarShadow: {
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderRadius: 40,
  },
  initialCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    color: '#222',
    fontSize: 28,
    fontWeight: '900',
  },
  spotUsername: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  spotPoints: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    marginTop: 2,
    marginBottom: 8,
  },
  podiumBlock: {
    width: 80,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  listWrap: {
    gap: 8,
    paddingHorizontal: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardRowCurrent: {
    backgroundColor: 'rgba(255, 212, 94, 0.25)',
  },
  cardAvatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTextWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flex: 1,
  },
  username: {
    color: '#fff',
    fontWeight: '800',
  },
  usernameCurrent: {
    color: '#FFD45E',
  },
  pointsSmall: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
  rankPill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rankPillCurrent: {
    backgroundColor: 'rgba(255, 212, 94, 0.25)',
  },
  rankPillText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  rankPillTextCurrent: {
    color: '#FFD45E',
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    paddingVertical: 20,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  loadingBadgeGradient: {
    flex: 1,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});


