import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  roundNumber: number;
  player1Username: string;
  player2Username: string;
  player1Score: number;
  player2Score: number;
  winner: string | null | undefined;
  mySocketId?: string | undefined;
};

export default function RoundResultView({ roundNumber, player1Username, player2Username, player1Score, player2Score, winner, mySocketId }: Props) {
  const resultText = winner
    ? winner === mySocketId
      ? '¡Ganaste esta ronda!'
      : 'Ganó tu oponente'
    : 'Empate';

  return (
    <View style={styles.resultContainer}>
      <Text style={styles.resultTitle}>Ronda {roundNumber} terminada</Text>
      <Text style={styles.resultVs}>
        {player1Username || 'P1'} {player1Score ?? 0} - {player2Score ?? 0} {player2Username || 'P2'}
      </Text>
      <Text style={styles.resultWinner}>{resultText}</Text>
      <Text style={styles.resultHint}>Esperando la siguiente ronda...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  resultTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  resultVs: { color: '#EAE6FF', fontSize: 16, marginTop: 12 },
  resultWinner: { color: '#FFD45E', fontSize: 18, fontWeight: '900', marginTop: 12 },
  resultHint: { color: '#FFFFFF', opacity: 0.8, fontSize: 12, marginTop: 8 },
});


