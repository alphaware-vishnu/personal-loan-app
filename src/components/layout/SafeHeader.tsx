/**
 * SafeHeader — Reusable screen header with back button and title
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

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
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {showBack && onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backButton, { backgroundColor: theme.colors.backgroundTertiary }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={styles.titleContainer}>
        <Text
          style={[styles.title, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
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
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
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