/**
 * SafeHeader — Reusable screen header with back button and title
 * Fibe-inspired design with rounded-square back button and subtle styling
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { AppText } from '../ui/AppText';

interface SafeHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export const SafeHeader: React.FC<SafeHeaderProps> = ({
  title,
  subtitle,
  onBack,
  showBack = true,
  rightAction,
}) => {
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <View style={styles.container}>
      {showBack && onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={[
            styles.backButton,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.06)'
                : theme.colors.backgroundSecondary,
              borderColor: isDark
                ? 'rgba(255,255,255,0.08)'
                : theme.colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={theme.colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={styles.titleContainer}>
        <AppText
          variant="label"
          style={[styles.title, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {title}
        </AppText>
        {subtitle && (
          <AppText
            variant="caption"
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </AppText>
        )}
      </View>

      {rightAction ? (
        <View style={styles.rightAction}>{rightAction}</View>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  spacer: {
    width: 40,
  },
  rightAction: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});