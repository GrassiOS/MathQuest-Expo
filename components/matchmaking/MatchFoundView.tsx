import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Face = { username: string; avatarComponent: React.ReactNode };

type Props = {
  me: Face;
  opponent: Face;
};

export default function MatchFoundView({ me, opponent }: Props) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={["#7C4DFF", "#6D28D9"]} style={styles.topHalf}>
        <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>PARTIDA</Text>
        <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>ENCONTRADA!</Text>
        <View style={styles.avatarBlock}>
          <View style={styles.avatarCircle}>{me.avatarComponent}</View>
          <Text style={[styles.username, { fontFamily: 'Digitalt' }]} numberOfLines={1}>{me.username}</Text>
        </View>
      </LinearGradient>

      <View style={styles.vsBar}>
        <Text style={[styles.vs, { fontFamily: 'Digitalt' }]}>VS</Text>
      </View>

      <LinearGradient colors={["#FF3D3D", "#B91C1C"]} style={styles.bottomHalf}>
        <View style={styles.avatarBlock}>
          <View style={styles.avatarCircle}>{opponent.avatarComponent}</View>
          <Text style={[styles.username, { fontFamily: 'Digitalt' }]} numberOfLines={1}>{opponent.username}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHalf: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomHalf: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarBlock: { alignItems: 'center', gap: 12, marginTop: 8 },
  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center' },
  username: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1.2 },
  vsBar: { height: 64, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  vs: { color: '#000000', fontSize: 28, fontWeight: '900', letterSpacing: 2 },
});


