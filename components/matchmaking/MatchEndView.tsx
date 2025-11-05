import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  didWin: boolean;
  player1Username: string;
  player2Username: string;
  player1TotalScore: number;
  player2TotalScore: number;
  pointsDelta: number;
  onExit: () => void;
};

export default function MatchEndView({ didWin, player1Username, player2Username, player1TotalScore, player2TotalScore, pointsDelta, onExit }: Props) {
  const title = didWin ? '¡GANASTE!' : 'PERDISTE';
  const deltaPrefix = pointsDelta > 0 ? '+' : '';
  const deltaColor = didWin ? '#10B981' : '#EF4444';

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#9C58FE", "#6F52FD"]} style={styles.gradientBackground} />

      <View style={styles.content}>
        <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>{title}</Text>

        <View style={styles.deltaBox}>
          <Text style={[styles.deltaText, { color: deltaColor, fontFamily: 'Digitalt' }]}>
            {deltaPrefix}{pointsDelta}
          </Text>
          <Text style={styles.deltaCaption}>PUNTOS</Text>
        </View>

        <View style={styles.scoresBox}>
          <View style={styles.scoreRow}>
            <Text style={[styles.userText, { fontFamily: 'Digitalt' }]} numberOfLines={1}>{player1Username?.toUpperCase() || 'P1'}</Text>
            <Text style={[styles.scoreText, { fontFamily: 'Digitalt' }]}>{player1TotalScore ?? 0}</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={[styles.userText, { fontFamily: 'Digitalt' }]} numberOfLines={1}>{player2Username?.toUpperCase() || 'P2'}</Text>
            <Text style={[styles.scoreText, { fontFamily: 'Digitalt' }]}>{player2TotalScore ?? 0}</Text>
          </View>
        </View>

        <Pressable onPress={onExit} style={({ pressed }) => [styles.exitButton, pressed && { opacity: 0.9 }]}>
          <LinearGradient colors={["#FFD616", "#F65D00"]} style={styles.exitButtonGradient}>
            <Text style={[styles.exitText, { fontFamily: 'Gilroy-Black' }]}>SALIR</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  title: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12 },
  deltaBox: { alignItems: 'center', marginBottom: 20 },
  deltaText: { fontSize: 42, fontWeight: '900' },
  deltaCaption: { color: '#EAE6FF', fontSize: 12, marginTop: 2 },
  scoresBox: { width: '100%', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 16, gap: 12, marginBottom: 24 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  scoreText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  exitButton: { height: 56, borderRadius: 28, overflow: 'hidden' },
  exitButtonGradient: { height: '100%', width: 180, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  exitText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
});


