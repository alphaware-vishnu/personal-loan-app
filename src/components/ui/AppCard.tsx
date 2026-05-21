import React from 'react';
import { View, StyleSheet, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, useTheme } from '../../theme';

export type AppCardVariant = 'flat' | 'elevated' | 'outlined' | 'glass';

export interface AppCardProps extends ViewProps {
  variant?: AppCardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: number;
}

export const AppCard: React.FC<AppCardProps> = ({
  variant = 'flat',
  padding = 'md',
  borderRadius,
  style,
  children,
  ...props
}) => {
  const colors = useColors();
  const { theme } = useTheme();

  // Spacing sizes
  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return theme.spacing['2'];
      case 'lg':
        return theme.spacing['6'];
      case 'xl':
        return theme.spacing['8'];
      case 'md':
      default:
        return theme.spacing['4'];
    }
  };

  const resolvedBorderRadius = borderRadius ?? theme.radii.xl;
  const paddingVal = getPadding();

  // Setup styles based on variant
  const cardStyle = [
    {
      borderRadius: resolvedBorderRadius,
      padding: paddingVal,
    },
    variant === 'flat' && {
      backgroundColor: colors.backgroundSecondary,
    },
    variant === 'elevated' && {
      backgroundColor: colors.surface,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
          shadowColor: colors.shadow,
        },
        default: {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
        },
      }),
    },
    variant === 'outlined' && {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    variant === 'glass' && {
      backgroundColor: theme.mode === 'light' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(15, 23, 42, 0.45)',
      borderWidth: 1.2,
      borderColor: theme.mode === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.1)',
      overflow: 'hidden' as const,
    },
    style,
  ];

  if (variant === 'glass') {
    return (
      <View style={cardStyle} {...props}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 25 : 12}
          style={StyleSheet.absoluteFillObject}
          tint={theme.mode === 'light' ? 'light' : 'dark'}
        />
        {/* Subtle interior glow */}
        <LinearGradient
          colors={
            theme.mode === 'light'
              ? ['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.05)']
              : ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.01)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={{ flex: 1, zIndex: 1 }}>{children}</View>
      </View>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};
