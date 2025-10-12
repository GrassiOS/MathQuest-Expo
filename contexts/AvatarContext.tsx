import { defaultAvatar } from '@/constants/avatarAssets';
import { Avatar } from '@/types/avatar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AvatarContextType {
  avatar: Avatar;
  updateAvatar: (newAvatar: Avatar) => Promise<void>;
  isLoading: boolean;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

const AVATAR_STORAGE_KEY = '@mathquest_user_avatar';

interface AvatarProviderProps {
  children: ReactNode;
}

export const AvatarProvider: React.FC<AvatarProviderProps> = ({ children }) => {
  const [avatar, setAvatar] = useState<Avatar>(defaultAvatar);
  const [isLoading, setIsLoading] = useState(true);

  // Load avatar from storage on app start
  useEffect(() => {
    loadAvatar();
  }, []);

  const loadAvatar = async () => {
    try {
      const storedAvatar = await AsyncStorage.getItem(AVATAR_STORAGE_KEY);
      if (storedAvatar) {
        const parsedAvatar = JSON.parse(storedAvatar);
        setAvatar(parsedAvatar);
      }
    } catch (error) {
      console.error('Failed to load avatar from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvatar = async (newAvatar: Avatar) => {
    try {
      await AsyncStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(newAvatar));
      setAvatar(newAvatar);
    } catch (error) {
      console.error('Failed to save avatar to storage:', error);
    }
  };

  const value: AvatarContextType = {
    avatar,
    updateAvatar,
    isLoading,
  };

  return (
    <AvatarContext.Provider value={value}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatar = (): AvatarContextType => {
  const context = useContext(AvatarContext);
  if (context === undefined) {
    throw new Error('useAvatar must be used within an AvatarProvider');
  }
  return context;
};

