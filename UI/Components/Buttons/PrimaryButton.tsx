/**
 * Primary Button Component
 * A reusable primary button with gradient styling
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  colors?: string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  colors = ['#FFD616', '#F65D00'],
  style,
  textStyle,
  size = 'medium',
  icon,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    if (disabled) baseStyle.push(styles.disabled);
    return [...baseStyle, style];
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    if (disabled) baseStyle.push(styles.disabledText);
    return [...baseStyle, textStyle];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={disabled ? ['#9ca3af', '#6b7280'] : colors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {icon && <>{icon}</>}
        <Text style={getTextStyle()}>
          {loading ? 'Cargando...' : title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 25,
    gap: 12,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  
  // Size variants
  small: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  medium: {
    paddingVertical: 18,
    paddingHorizontal: 30,
  },
  large: {
    paddingVertical: 22,
    paddingHorizontal: 40,
  },
  
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  // State variants
  disabled: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.8,
  },
});
