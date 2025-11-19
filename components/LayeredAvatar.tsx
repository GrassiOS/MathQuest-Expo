import { avatarAssets } from '@/constants/avatarAssets';
import { Avatar } from '@/types/avatar';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { SvgUri } from 'react-native-svg';

interface LayeredAvatarProps {
  avatar: Avatar;
  size?: number;
  style?: any;
}

const RemoteSvgLayer: React.FC<{ uri: string; size: number }> = ({ uri, size }) => {
  const [localUri, setLocalUri] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Prepare cache directory
        const dir = FileSystem.cacheDirectory ? `${FileSystem.cacheDirectory}svgs/` : null;
        if (!dir) {
          // Fallback to direct URI usage
          if (mounted) setLocalUri(uri);
          return;
        }
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
        const safeName = encodeURIComponent(uri).slice(0, 200);
        const fileUri = `${dir}${safeName}.svg`;
        const info = await FileSystem.getInfoAsync(fileUri);
        if (!info.exists) {
          await FileSystem.downloadAsync(uri, fileUri);
        }
        if (mounted) setLocalUri(fileUri);
      } catch {
        if (mounted) setLocalUri(uri); // use network URI as fallback
      }
    })();
    return () => { mounted = false; };
  }, [uri]);

  if (!localUri) return null;
  return <SvgUri uri={localUri} width={size} height={size} />;
};

function isRemoteSvg(value: string | undefined): value is string {
  if (!value) return false;
  const v = String(value);
  return v.startsWith('http://') || v.startsWith('https://') || v.startsWith('file://') || /\.svg(\?|#|$)/i.test(v) || v.includes('/');
}

export const LayeredAvatar: React.FC<LayeredAvatarProps> = ({
  avatar,
  size = 120,
  style,
}) => {
  const layers = useMemo(() => ([
    ['skin', avatar.skin_asset],
    ['hair', avatar.hair_asset],
    ['eyes', avatar.eyes_asset],
    ['mouth', avatar.mouth_asset],
    ['clothes', avatar.clothes_asset],
  ] as Array<[keyof typeof avatarAssets, string | undefined]>), [avatar]);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {layers.map(([category, value]) => {
        if (!value || value === 'none') return null;
        const LocalComp = avatarAssets[category][value as any];
        return (
          <View key={`${category}-${value}`} style={styles.layer}>
            {LocalComp
              ? <LocalComp width={size} height={size} />
              : (isRemoteSvg(value) ? <RemoteSvgLayer uri={value} size={size} /> : null)}
          </View>
        );
      })}
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

