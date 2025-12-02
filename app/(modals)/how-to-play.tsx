import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpenText, CheckCircle, Clock, DiceFour, Medal, Trophy, X } from 'phosphor-react-native';

import AnimatedMathBackground from '@/components/ui/AnimatedMathBackground';
import { useFontContext } from '@/contexts/FontsContext';

export default function HowToPlayModal() {
  const { fontsLoaded } = useFontContext();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6E72FC', '#AD1DEB']} style={StyleSheet.absoluteFill} />
      <AnimatedMathBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>¿CÓMO JUGAR?</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
            <X size={24} color="#FFFFFF" weight="bold" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.ruleRow}>
            <Trophy size={22} color="#FFFFFF" weight="fill" />
            <Text style={styles.ruleText}>3 RONDAS</Text>
          </View>
          <View style={styles.ruleRow}>
            <DiceFour size={22} color="#FFFFFF" weight="fill" />
            <Text style={styles.ruleText}>
              AL EMPEZAR CADA RONDA, SE GIRARÁ UNA RULETA PARA DETERMINAR LA CATEGORIA (SUMA, RESTA, MULTIPLICACIÓN, DIVISIÓN, HÍBRIDO)
            </Text>
          </View>
          <View style={styles.ruleRow}>
            <BookOpenText size={22} color="#FFFFFF" weight="fill" />
            <Text style={styles.ruleText}>6 PREGUNTAS POR RONDA</Text>
          </View>
          <View style={styles.ruleRow}>
            <CheckCircle size={22} color="#34C759" weight="fill" />
            <Text style={styles.ruleText}>PREGUNTA CORRECTA = +100 PUNTOS</Text>
          </View>
          <View style={styles.ruleRow}>
            <Clock size={22} color="#FFD45E" weight="fill" />
            <Text style={styles.ruleText}>EL PRIMERO EN TERMINAR = +50 PUNTOS</Text>
          </View>
          <View style={styles.ruleRow}>
            <Medal size={22} color="#FFD45E" weight="fill" />
            <Text style={styles.ruleText}>EL PRIMERO EN GANAR 2 DE 3 RONDAS, SERÁ EL GANADOR</Text>
          </View>
          <View style={[styles.divider, { marginVertical: 12 }]} />
          <View style={styles.ruleRow}>
            <Trophy size={22} color="#FFD700" weight="fill" />
            <Text style={styles.ruleText}>SI GANAS: +30 ELO</Text>
          </View>
          <View style={styles.ruleRow}>
            <Trophy size={22} color="#FF3B30" weight="fill" />
            <Text style={styles.ruleText}>SI PIERDES: -25 ELO</Text>
          </View>
        </ScrollView>
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
  content: {
    paddingVertical: 16,
    gap: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.20)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ruleText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});


