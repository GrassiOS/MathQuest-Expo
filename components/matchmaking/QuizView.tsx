import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Category = { id: string; name: string; emoji: string; color: string } | undefined;

type Props = {
  roundNumber: number;
  category?: Category;
  question: string;
  index: number;
  total: number;
  answerText: string;
  localScore: number;
  disabled?: boolean;
  onDigit: (d: string) => void;
  onClear: () => void;
  onOk: () => void;
};

export default function QuizView({ roundNumber, category, question, index, total, answerText, localScore, disabled, onDigit, onClear, onOk }: Props) {
  return (
    <View style={styles.quizContainer}>
      {/* Header */}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Text style={styles.roundTitle}>RONDA {roundNumber || 1}</Text>
        <Text style={styles.roundSubtitle}>{category?.name?.toUpperCase() || 'CATEGORÍA'}</Text>
        <Text style={styles.progressText}>Pregunta {index + 1} de {total || 6}</Text>
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{question}</Text>
      </View>

      {/* Answer display */}
      <View style={styles.answerDisplay}>
        <Text style={styles.answerText}>{answerText === '' ? '0' : answerText}</Text>
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {[['1','2','3'],['4','5','6'],['7','8','9'],['C','0','OK']].map((row, rIdx) => (
          <View key={`row-${rIdx}`} style={styles.keypadRow}>
            {row.map(key => (
              <TouchableOpacity
                key={key}
                style={[styles.keypadBtn, key === 'OK' ? styles.keypadOk : key === 'C' ? styles.keypadClear : null]}
                onPress={() => {
                  if (key === 'OK') return onOk();
                  if (key === 'C') return onClear();
                  onDigit(key);
                }}
                disabled={disabled}
              >
                <Text style={styles.keypadBtnText}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Score (local) */}
      <Text style={styles.localScore}>Mi puntaje: {localScore}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  quizContainer: { flex: 1, paddingHorizontal: 24, justifyContent: 'flex-start' },
  roundTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  roundSubtitle: { color: '#D6CCFF', fontSize: 14, marginTop: 2 },
  progressText: { color: '#EAE6FF', opacity: 0.9, fontSize: 12, marginTop: 4 },
  questionCard: { marginTop: 24, backgroundColor: 'rgba(0,0,0,0.15)', paddingVertical: 24, paddingHorizontal: 20, borderRadius: 24, alignItems: 'center' },
  questionText: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  answerDisplay: { marginTop: 16, backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  answerText: { color: '#000000', fontSize: 24, fontWeight: '900' },
  keypad: { marginTop: 16 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  keypadBtn: { flex: 1, marginHorizontal: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  keypadBtnText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  keypadOk: { backgroundColor: '#FF46A5' },
  keypadClear: { backgroundColor: 'rgba(255,255,255,0.25)' },
  localScore: { marginTop: 8, color: '#FFFFFF', opacity: 0.9, textAlign: 'center' },
});


