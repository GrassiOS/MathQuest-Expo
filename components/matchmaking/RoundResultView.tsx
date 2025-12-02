import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';

type Props = {
  roundNumber: number;
  player1Username: string;
  player2Username: string;
  player1Score: number;
  player2Score: number;
  winner: string | null | undefined;
  mySocketId?: string | undefined;
  player1Id?: string | undefined;
  player2Id?: string | undefined;
};

export default function RoundResultView({
  roundNumber,
  player1Username,
  player2Username,
  player1Score,
  player2Score,
  winner,
  mySocketId,
  player1Id,
  player2Id,
}: Props) {
  // Keep the local player on the left when IDs allow it
  const computedLeftRight = useMemo(() => {
    const p1 = { username: player1Username, score: player1Score, id: player1Id };
    const p2 = { username: player2Username, score: player2Score, id: player2Id };
    if (mySocketId && p2.id && p2.id === mySocketId) {
      return { left: p2, right: p1 };
    }
    return { left: p1, right: p2 };
  }, [player1Username, player2Username, player1Score, player2Score, player1Id, player2Id, mySocketId]);

  const leftIsMe = Boolean(mySocketId && computedLeftRight.left.id && computedLeftRight.left.id === mySocketId);
  const rightIsMe = Boolean(mySocketId && computedLeftRight.right.id && computedLeftRight.right.id === mySocketId);

  const leftName = leftIsMe ? 'TU' : (computedLeftRight.left.username || 'P1');
  const rightName = rightIsMe ? 'TU' : (computedLeftRight.right.username || 'P2');

  // Count-up animation for scores (about 2.2s), then reveal result after a short pause
  const [displayLeftScore, setDisplayLeftScore] = useState(0);
  const [displayRightScore, setDisplayRightScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const timerRef = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    const DURATION_MS = 2200;
    const START = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - START;
      const p = Math.min(1, elapsed / DURATION_MS);
      setDisplayLeftScore(Math.round(computedLeftRight.left.score * p));
      setDisplayRightScore(Math.round(computedLeftRight.right.score * p));
      if (p >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => setShowResult(true), 600); // reveal after a brief pause
      }
    }, 30);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [computedLeftRight.left.score, computedLeftRight.right.score]);

  const didIWin = Boolean(winner && mySocketId && winner === mySocketId);
  const resultText = !winner ? 'Empate' : didIWin ? '¡Ganaste esta ronda!' : 'Ganó tu oponente';
  const resultColor = !winner ? '#FFD60A' : didIWin ? '#34C759' : '#FF3B30';

  return (
    <View style={styles.resultContainer}>
      {/* Confetti overlay, only after the reveal and only if I won */}
      {showResult && didIWin && (
        <LottieView
          source={require('@/assets/lotties/extras/Confetti_quick.json')}
          autoPlay
          loop={false}
          style={styles.confetti}
        />
      )}
      <Text style={styles.resultTitle}>RONDA {roundNumber}</Text>
      <Text style={styles.resultVs}>
        {leftName} {showResult ? computedLeftRight.left.score : displayLeftScore} - {showResult ? computedLeftRight.right.score : displayRightScore} {rightName}
      </Text>
      {showResult ? (
        <Text style={[styles.resultWinner, { color: resultColor }]}>{resultText}</Text>
      ) : (
        <Text style={styles.resultHint}>Calculando puntajes…</Text>
      )}
      {showResult && <Text style={styles.resultHint}>Esperando la siguiente ronda...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  resultTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: 1.2 },
  resultVs: { color: '#EAE6FF', fontSize: 22, marginTop: 16, fontWeight: '800' },
  resultWinner: { color: '#FFD45E', fontSize: 22, fontWeight: '900', marginTop: 16 },
  resultHint: { color: '#FFFFFF', opacity: 0.8, fontSize: 12, marginTop: 8 },
  confetti: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 10, pointerEvents: 'none' },
});


