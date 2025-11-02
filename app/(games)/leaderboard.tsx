import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AnimatedMathBackground from '@/components/ui/AnimatedMathBackground';
import { useFontContext } from '@/contexts/FontsContext';
import { useOfflineStorage } from '@/contexts/OfflineStorageContext';

const { height } = Dimensions.get('window');

type ModeOption = 0.5 | 1 | 3 | 5 | 'all';
type ScopeOption = 'today' | 'all';

export default function LeaderboardScreen() {
  console.log('Leaderboard screen mounted');

  const { fontsLoaded } = useFontContext();

  const { getTopScores, getTopScoresToday } = useOfflineStorage();

  const [mode, setMode] = useState<ModeOption>('all');
  const [scope, setScope] = useState<ScopeOption>('today');

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [mode, scope]);

  const scores = useMemo(() => {
    const m = mode === 'all' ? undefined : mode;
    return scope === 'today' ? getTopScoresToday(m as any, 10) : getTopScores(m as any, 10);
  }, [mode, scope, getTopScores, getTopScoresToday]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#A855F7", "#7C3AED"]} style={styles.gradientBackground} />
      <AnimatedMathBackground />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <FontAwesome5 name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>CLASIFICACIÓN</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.selectorsRow}>
          {(['all', 0.5, 1, 3, 5] as ModeOption[]).map(opt => (
            <TouchableOpacity key={`${opt}`} style={[styles.selectorChip, mode === opt && styles.selectorChipActive]} onPress={() => setMode(opt)}>
              <Text style={[styles.selectorChipText, { fontFamily: 'Gilroy-Black' }]}>{opt === 'all' ? 'Todos' : opt === 0.5 ? '30s' : `${opt}m`}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.selectorsRow}>
          {(['today', 'all'] as ScopeOption[]).map(opt => (
            <TouchableOpacity key={opt} style={[styles.selectorChip, scope === opt && styles.selectorChipActive]} onPress={() => setScope(opt)}>
              <Text style={[styles.selectorChipText, { fontFamily: 'Gilroy-Black' }]}>{opt === 'today' ? 'Hoy' : 'Histórico'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slide }] }}>
          {scores.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { fontFamily: 'Gilroy-Black' }]}>No hay puntuaciones</Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {scores.map((score, index) => (
                <View key={score.id} style={styles.row}>
                  <View style={[styles.rankCircle, index === 0 && styles.rankGold, index === 1 && styles.rankSilver, index === 2 && styles.rankBronze]}>
                    <Text style={[styles.rankText, { fontFamily: 'Digitalt' }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.rowCenter}>
                    <Text style={[styles.rowName, { fontFamily: 'Digitalt' }]}>{score.alias || score.username || 'Anónimo'}</Text>
                    <Text style={[styles.rowSub, { fontFamily: 'Gilroy-Black' }]}>{score.mode === 0.5 ? '30s' : `${score.mode}m`} • {new Date(score.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={[styles.pointsText, { fontFamily: 'Digitalt' }]}>{score.score}</Text>
                    <Text style={[styles.accText, { fontFamily: 'Gilroy-Black' }]}>{score.accuracy.toFixed(0)}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gradientBackground: { position: 'absolute', left: 0, right: 0, top: 0, height },
  safeArea: { flex: 1, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 24 },
  selectorsRow: { flexDirection: 'row', gap: 8, paddingVertical: 10, justifyContent: 'center' },
  selectorChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)' },
  selectorChipActive: { backgroundColor: 'rgba(255,255,255,0.35)' },
  selectorChipText: { color: '#fff' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#fff', fontSize: 16, opacity: 0.8 },
  listWrap: { marginTop: 10, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 },
  rankCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)', marginRight: 10 },
  rankGold: { backgroundColor: '#FFD700' },
  rankSilver: { backgroundColor: '#C0C0C0' },
  rankBronze: { backgroundColor: '#CD7F32' },
  rankText: { color: '#000', fontWeight: 'bold' },
  rowCenter: { flex: 1 },
  rowName: { color: '#fff', fontSize: 16 },
  rowSub: { color: '#fff', opacity: 0.8, fontSize: 12 },
  rowRight: { alignItems: 'flex-end' },
  pointsText: { color: '#fff', fontSize: 18 },
  accText: { color: '#fff', opacity: 0.8, fontSize: 12 },
});
