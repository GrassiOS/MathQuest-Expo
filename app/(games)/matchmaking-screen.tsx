import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LayeredAvatar } from '@/components/LayeredAvatar';
import MatchFoundView from '@/components/matchmaking/MatchFoundView';
import MatchmakingView from '@/components/matchmaking/MatchmakingView';
import AnimatedMathBackground from '@/components/ui/AnimatedMathBackground';
import { useAvatar } from '@/contexts/AvatarContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFontContext } from '@/contexts/FontsContext';
import { useWebSocket } from '@/hooks/useWebSocket';

type Phase = 'MATCHMAKING' | 'MATCH_FOUND';

export default function MatchmakingScreen() {
  const { fontsLoaded } = useFontContext();
  const { user } = useAuth();
  const { avatar } = useAvatar();
  const {
    isConnected,
    findPlayer,
    cancelSearch,
    onPlayerFound,
  } = useWebSocket();

  const [phase, setPhase] = useState<Phase>('MATCHMAKING');
  const [queuePosition, setQueuePosition] = useState<number | undefined>();
  const [opponent, setOpponent] = useState<{ userId: string; username: string } | null>(null);

  const myUserId = useMemo(() => user?.id ?? `guest_${Date.now()}`, [user?.id]);
  const myUsername = useMemo(() => (user?.username || user?.email || 'Jugador').toString(), [user?.username, user?.email]);

  useEffect(() => {
    // Setup listener for when a player is found
    onPlayerFound((data) => {
      setOpponent(data.opponent);
      setPhase('MATCH_FOUND');
    });
  }, [onPlayerFound]);

  useEffect(() => {
    if (isConnected) {
      findPlayer(myUserId, myUsername);
    }
  }, [isConnected, findPlayer, myUserId, myUsername]);

  const handleCancel = () => {
    cancelSearch(myUserId);
    router.back();
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#7C4DFF", "#6D28D9"]} style={styles.gradientBackground} />
      <AnimatedMathBackground />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        {phase === 'MATCHMAKING' ? (
          <MatchmakingView
            username={myUsername?.toUpperCase()}
            avatarComponent={<LayeredAvatar avatar={avatar} size={92} />}
            onCancel={handleCancel}
            position={queuePosition}
          />
        ) : (
          <MatchFoundView
            me={{ username: myUsername?.toUpperCase(), avatarComponent: <LayeredAvatar avatar={avatar} size={92} /> }}
            opponent={{ username: (opponent?.username || 'OPONENTE').toUpperCase(), avatarComponent: <LayeredAvatar avatar={avatar} size={92} /> }}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6D28D9' },
});


