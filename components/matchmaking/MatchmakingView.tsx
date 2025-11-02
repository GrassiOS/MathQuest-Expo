import LottieView from 'lottie-react-native';
import React, { useRef } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

const { height } = Dimensions.get('window');

type Props = {
  username: string;
  avatarComponent: React.ReactNode;
  onCancel: () => void;
  position?: number;
};

export default function MatchmakingView({ username, avatarComponent, onCancel, position }: Props) {
  const lottieRef = useRef<LottieView>(null);

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>BUSCANDO</Text>
        <Text style={[styles.title, { fontFamily: 'Digitalt' }]}>OPONENTE...</Text>
      </View>

      <View style={styles.meWrap}>
        <View style={styles.avatarCircle}>{avatarComponent}</View>
        <Text style={[styles.username, { fontFamily: 'Digitalt' }]} numberOfLines={1}>
          {username}
        </Text>
      </View>

      <View style={styles.lottieWrap}>
        <LottieView
          ref={lottieRef}
          autoPlay
          loop
          source={require('@/assets/lotties/extras/lupa.json')}
          style={styles.lottie}
        />
      </View>

      <View style={styles.footer}>
        <Pressable onPress={onCancel} style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.9 }]}>
          <Text style={[styles.cancelText, { fontFamily: 'Digitalt' }]}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16, justifyContent: 'space-between' },
  headerWrap: { marginTop: 8 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: 1.5, textAlign: 'left' },
  meWrap: { alignItems: 'center', gap: 12, marginTop: 10 },
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
  username: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1.2 },
  lottieWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 16, flex: 1 },
  lottie: { width: height * 0.3, height: height * 0.3 },
  footer: { paddingBottom: 28 },
  cancelButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFA500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  cancelText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
});


