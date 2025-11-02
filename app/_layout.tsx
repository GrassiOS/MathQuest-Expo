import AuthGuard from '@/components/AuthGuard';
import { AuthProvider } from '@/contexts/AuthContext';
import { AvatarProvider } from '@/contexts/AvatarContext';
import { FontProvider } from '@/contexts/FontsContext';
import { GameProvider } from '@/contexts/GameContext';
import { OfflineStorageProvider } from '@/contexts/OfflineStorageContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Slot } from 'expo-router';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <FontProvider>
      <AuthProvider>
        <AuthGuard>
          <AvatarProvider>
            <GameProvider>
              <OfflineStorageProvider>
                <Slot />
              </OfflineStorageProvider>
            </GameProvider>
          </AvatarProvider>
        </AuthGuard>
      </AuthProvider>
    </FontProvider>
  );
}
