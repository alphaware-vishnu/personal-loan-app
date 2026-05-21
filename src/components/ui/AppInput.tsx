import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors, useTheme } from '../../theme';
import { AppText } from './AppText';

export interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  type?: 'text' | 'number' | 'phone' | 'pan' | 'password';
  success?: boolean;
}

export const AppInput = forwardRef<TextInput, AppInputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  type = 'text',
  success = false,
  style,
  onFocus,
  onBlur,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  ...props
}, ref) => {
  const colors = useColors();
  const { theme } = useTheme();
  
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const isPassword = type === 'password';
  const resolvedSecureTextEntry = isPassword ? !showPassword : secureTextEntry;

  // Determine keyboard/capitalize defaults based on type
  const getKeyboardType = () => {
    if (keyboardType) return keyboardType;
    switch (type) {
      case 'number':
        return 'numeric';
      case 'phone':
        return 'phone-pad';
      default:
        return 'default';
    }
  };

  const getAutoCapitalize = () => {
    if (autoCapitalize) return autoCapitalize;
    if (type === 'pan') return 'characters' as const;
    return 'none' as const;
  };

  // Border and background state styling
  const getContainerStyle = () => {
    let borderColor = colors.border;
    let backgroundColor = colors.backgroundSecondary;

    if (error) {
      borderColor = colors.error;
    } else if (isFocused) {
      borderColor = colors.primary;
    } else if (success) {
      borderColor = colors.success;
    }

    return {
      borderColor,
      backgroundColor,
    };
  };

  return (
    <View style={styles.container}>
      {label && (
        <AppText variant="label" style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </AppText>
      )}
      
      <View style={[styles.inputWrapper, getContainerStyle()]}>
        {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}
        
        <TextInput
          ref={ref}
          style={[
            styles.input,
            { color: colors.text, fontFamily: theme.typography.fonts.regular },
            style
          ]}
          placeholderTextColor={colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={resolvedSecureTextEntry}
          keyboardType={getKeyboardType()}
          autoCapitalize={getAutoCapitalize()}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity
            style={styles.rightIconWrapper}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        
        {!isPassword && rightIcon && (
          <View style={styles.rightIconWrapper}>{rightIcon}</View>
        )}
      </View>
      
      {(error || helperText) && (
        <AppText
          variant="caption"
          style={[
            styles.helperText,
            { color: error ? colors.error : colors.textSecondary }
          ]}
        >
          {error || helperText}
        </AppText>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  leftIconWrapper: {
    marginRight: 8,
  },
  rightIconWrapper: {
    marginLeft: 8,
  },
  helperText: {
    marginTop: 4,
  },
});
