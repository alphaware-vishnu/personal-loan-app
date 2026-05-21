import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../theme';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry: () => void;
  loading?: boolean;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'We encountered an error while processing your request. Please check your internet connection and try again.',
  onRetry,
  loading = false,
  style,
}) => {
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      {/* Icon Circle */}
      <View style={[styles.iconWrapper, { backgroundColor: colors.errorLight }]}>
        <Feather name="wifi-off" size={32} color={colors.error} />
      </View>

      {/* Info text */}
      <AppText variant="h2" align="center" style={[styles.title, { color: colors.text }]}>
        {title}
      </AppText>
      
      <AppText variant="bodyMd" align="center" style={[styles.description, { color: colors.textSecondary }]}>
        {description}
      </AppText>

      {/* Retry Button */}
      <AppButton
        title="Try Again"
        onPress={onRetry}
        variant="primary"
        size="md"
        loading={loading}
        style={styles.actionBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    width: '100%',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 10,
  },
  description: {
    marginBottom: 28,
    maxWidth: '85%',
  },
  actionBtn: {
    minWidth: 160,
  },
});
