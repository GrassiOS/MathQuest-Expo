import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

interface LogoHeaderProps {
  size?: 'small' | 'medium' | 'large';
}

export const LogoHeader: React.FC<LogoHeaderProps> = ({ size = 'medium' }) => {
  const getLogoSize = () => {
    switch (size) {
      case 'small':
        return { width: 120, height: 120 };
      case 'large':
        return { width: 200, height: 200 };
      case 'medium':
      default:
        return { width: 160, height: 160 };
    }
  };

  const logoSize = getLogoSize();

  return (
    <View style={styles.container}>
      <View style={[styles.logoContainer, { ...logoSize }]}>
        <Image
          source={require('../../assets/images/MQ_logo.png')}
          style={[styles.logo, { ...logoSize }]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  logo: {
    borderRadius: 10,
  },
});

export default LogoHeader;
