import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors, useTheme } from '../../theme';
import { AppText } from './AppText';

export type AppButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'outline'
  | 'ghost';

export type AppButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  hapticFeedback = 'light',
  style,
  children,
  onPress,
  ...props
}) => {
  const colors = useColors();
  const { theme } = useTheme();

  const handlePress = async (event: any) => {
    if (onPress) {
      if (hapticFeedback !== 'none') {
        try {
          switch (hapticFeedback) {
            case 'medium':
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              break;
            case 'heavy':
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              break;
            case 'selection':
              await Haptics.selectionAsync();
              break;
            case 'light':
            default:
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              break;
          }
        } catch (e) {
          // Fallback if haptics fail or aren't supported
        }
      }
      onPress(event);
    }
  };

  const isDisabled = disabled || loading;

  // Background and border styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          borderWidth: 1,
        };
      case 'secondary':
        return {
          backgroundColor: colors.backgroundTertiary,
          borderColor: colors.border,
          borderWidth: 1,
        };
      case 'success':
        return {
          backgroundColor: colors.success,
          borderColor: colors.success,
          borderWidth: 1,
        };
      case 'danger':
        return {
          backgroundColor: colors.error,
          borderColor: colors.error,
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary,
          borderWidth: 1.5,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        };
    }
  };

  // Text color based on variant
  const getTextColor = () => {
    if (isDisabled) {
      return colors.textTertiary;
    }
    switch (variant) {
      case 'primary':
      case 'success':
      case 'danger':
        return theme.mode === 'light' ? colors.background : colors.background;
      case 'outline':
      case 'ghost':
        return colors.primary;
      case 'secondary':
      default:
        return colors.text;
    }
  };

  // Height and padding based on size
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          height: 40,
          paddingHorizontal: theme.spacing['3'],
          borderRadius: theme.radii.md,
        };
      case 'lg':
        return {
          height: 56,
          paddingHorizontal: theme.spacing['6'],
          borderRadius: theme.radii.xl,
        };
      case 'md':
      default:
        return {
          height: 48,
          paddingHorizontal: theme.spacing['4'],
          borderRadius: theme.radii.lg,
        };
    }
  };

  // Text variant based on size
  const getTextVariant = () => {
    switch (size) {
      case 'sm':
        return 'buttonSm';
      case 'lg':
        return 'buttonLg';
      case 'md':
      default:
        return 'buttonMd';
    }
  };

  const buttonStyle = [
    styles.base,
    getVariantStyles(),
    getSizeStyles(),
    isDisabled && {
      backgroundColor: variant === 'outline' || variant === 'ghost' ? 'transparent' : colors.surfacePressed,
      borderColor: variant === 'outline' ? colors.border : 'transparent',
      opacity: 0.6,
    },
    style,
  ];

  const textColor = getTextColor();
  const textVariant = getTextVariant();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={buttonStyle}
      onPress={handlePress}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          {title ? (
            <AppText variant={textVariant} style={{ color: textColor }}>
              {title}
            </AppText>
          ) : (
            children
          )}
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
