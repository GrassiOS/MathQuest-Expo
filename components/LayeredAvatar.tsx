import { avatarAssets } from '@/constants/avatarAssets';
import { Avatar } from '@/types/avatar';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface LayeredAvatarProps {
  avatar: Avatar;
  size?: number;
  style?: any;
}

export const LayeredAvatar: React.FC<LayeredAvatarProps> = ({
  avatar,
  size = 120,
  style,
}) => {
  const renderLayer = (assetKey: string | undefined, category: keyof typeof avatarAssets) => {
    if (!assetKey || assetKey === 'none' || !avatarAssets[category][assetKey]) {
      return null;
    }

    const SvgComponent = avatarAssets[category][assetKey];
    
    // Handle null components (for "none" options)
    if (!SvgComponent) {
      return null;
    }
    
    return (
      <View key={`${category}-${assetKey}`} style={styles.layer}>
        <SvgComponent 
          width={size} 
          height={size} 
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Layer order is important - render from back to front */}
      {renderLayer(avatar.skin_asset, 'skin')}
      {renderLayer(avatar.hair_asset, 'hair')}
      {renderLayer(avatar.eyes_asset, 'eyes')}
      {renderLayer(avatar.mouth_asset, 'mouth')}
      {renderLayer(avatar.clothes_asset, 'clothes')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

