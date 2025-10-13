import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface AuthInputProps extends TextInputProps {
  icon: string;
  label?: string;
  error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  icon,
  label,
  error,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { fontFamily: 'Gilroy-Black' }]}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputContainerError]}>
        <View style={styles.iconContainer}>
          <FontAwesome5 name={icon} size={16} color="#7c3aed" />
        </View>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="rgba(255,255,255,0.6)"
          {...props}
        />
      </View>
      {error && <Text style={[styles.errorText, { fontFamily: 'Gilroy-Black' }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputContainerError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Gilroy-Black',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default AuthInput;
