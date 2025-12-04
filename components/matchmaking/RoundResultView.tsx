import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';

type Props = {
  roundNumber: number;
  player1Username: string;
  player2Username: string;
  player1Score: number;
  player2Score: number;
  player1TotalBefore?: number;
  player2TotalBefore?: number;
  winner: string | null | undefined;
  mySocketId?: string | undefined;
  player1Id?: string | undefined;
  player2Id?: string | undefined;
  onDone?: () => void;
};

export default function RoundResultView({
  roundNumber,
  player1Username,
  player2Username,
  player1Score,
  player2Score,
  player1TotalBefore = 0,
  player2TotalBefore = 0,
  winner,
  mySocketId,
  player1Id,
  player2Id,
  onDone,
}: Props) {
  // Keep the local player on the left when IDs allow it
  const computedLeftRight = useMemo(() => {
    const p1 = { username: player1Username, score: player1Score, id: player1Id, totalBefore: player1TotalBefore };
    const p2 = { username: player2Username, score: player2Score, id: player2Id, totalBefore: player2TotalBefore };
    if (mySocketId && p2.id && p2.id === mySocketId) {
      return { left: p2, right: p1 };
    }
    return { left: p1, right: p2 };
  }, [player1Username, player2Username, player1Score, player2Score, player1Id, player2Id, player1TotalBefore, player2TotalBefore, mySocketId]);

  const leftIsMe = Boolean(mySocketId && computedLeftRight.left.id && computedLeftRight.left.id === mySocketId);
  const rightIsMe = Boolean(mySocketId && computedLeftRight.right.id && computedLeftRight.right.id === mySocketId);

  const leftName = leftIsMe ? 'TU' : (computedLeftRight.left.username || 'P1');
  const rightName = rightIsMe ? 'TU' : (computedLeftRight.right.username || 'P2');

  // Animation values: fade in totals, then count-up to totals + round, then reveal result and hint
  const totalsOpacity = useRef(new Animated.Value(0)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const leftTotalValue = useRef(new Animated.Value(computedLeftRight.left.totalBefore || 0)).current;
  const rightTotalValue = useRef(new Animated.Value(computedLeftRight.right.totalBefore || 0)).current;
  const [displayLeftTotal, setDisplayLeftTotal] = useState<number>(computedLeftRight.left.totalBefore || 0);
  const [displayRightTotal, setDisplayRightTotal] = useState<number>(computedLeftRight.right.totalBefore || 0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const leftListener = leftTotalValue.addListener(({ value }) => setDisplayLeftTotal(Math.round(value)));
    const rightListener = rightTotalValue.addListener(({ value }) => setDisplayRightTotal(Math.round(value)));
    return () => {
      if (leftListener) leftTotalValue.removeListener(leftListener);
      if (rightListener) rightTotalValue.removeListener(rightListener);
      leftTotalValue.removeAllListeners();
      rightTotalValue.removeAllListeners();
    };
  }, [leftTotalValue, rightTotalValue]);

  useEffect(() => {
    totalsOpacity.setValue(0);
    resultOpacity.setValue(0);
    leftTotalValue.setValue(computedLeftRight.left.totalBefore || 0);
    rightTotalValue.setValue(computedLeftRight.right.totalBefore || 0);
    setDisplayLeftTotal(computedLeftRight.left.totalBefore || 0);
    setDisplayRightTotal(computedLeftRight.right.totalBefore || 0);
    setShowResult(false);

    const fadeInTotals = Animated.timing(totalsOpacity, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const COUNT_DURATION_MS = 2200;
    const addLeft = Animated.timing(leftTotalValue, {
      toValue: (computedLeftRight.left.totalBefore || 0) + (computedLeftRight.left.score || 0),
      duration: COUNT_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    const addRight = Animated.timing(rightTotalValue, {
      toValue: (computedLeftRight.right.totalBefore || 0) + (computedLeftRight.right.score || 0),
      duration: COUNT_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    fadeInTotals.start(() => {
      Animated.parallel([addLeft, addRight]).start(() => {
        setTimeout(() => {
          setShowResult(true);
          Animated.timing(resultOpacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            setTimeout(() => {
              if (onDone) onDone();
            }, 2500);
          });
        }, 400);
      });
    });
    return () => {
      totalsOpacity.stopAnimation();
      resultOpacity.stopAnimation();
    };
  }, [computedLeftRight.left.totalBefore, computedLeftRight.right.totalBefore, computedLeftRight.left.score, computedLeftRight.right.score, onDone, totalsOpacity, resultOpacity, leftTotalValue, rightTotalValue]);

  const didIWin = Boolean(winner && mySocketId && winner === mySocketId);
  const resultText = !winner ? 'Empate' : didIWin ? '¡Ganaste esta ronda!' : 'Ganó tu oponente';
  const resultColor = !winner ? '#FFD60A' : didIWin ? '#34C759' : '#FF3B30';
  const myBefore = leftIsMe ? (computedLeftRight.left.totalBefore || 0) : (computedLeftRight.right.totalBefore || 0);
  const oppBefore = leftIsMe ? (computedLeftRight.right.totalBefore || 0) : (computedLeftRight.left.totalBefore || 0);
  const iWasLeading = myBefore > oppBefore;

  const hintText = useMemo(() => {
    if (!winner) {
      return iWasLeading ? '¡Sigue así!' : '¡Vamos, tú puedes!';
    }
    if (didIWin) {
      return iWasLeading ? '¡Sigue así!' : '¡Vas remontando!';
    }
    return iWasLeading ? '¡Pero sigues ganando!' : '¡No te rindas!';
  }, [didIWin, iWasLeading, winner]);

  return (
    <View style={styles.resultContainer}>
      {showResult && didIWin && (
        <LottieView
          source={require('@/assets/lotties/extras/Confetti_quick.json')}
          autoPlay
          loop={false}
          style={styles.confetti}
        />
      )}
      <Text style={styles.resultTitle}>RONDA {roundNumber}</Text>
      <Animated.Text style={[styles.resultVs, { opacity: totalsOpacity }]}>
        {leftName} {displayLeftTotal} - {displayRightTotal} {rightName}
      </Animated.Text>
      {showResult ? (
        <>
          <Animated.Text style={[styles.resultWinner, { color: resultColor, opacity: resultOpacity }]}>{resultText}</Animated.Text>
          <Animated.Text style={[styles.resultHint, { opacity: resultOpacity }]}>{hintText}</Animated.Text>
          <Text style={styles.resultHint}>Esperando la siguiente ronda...</Text>
        </>
      ) : (
        <Text style={styles.resultHint}>Calculando puntajes…</Text>
      )}
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


