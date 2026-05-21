import React, { ComponentProps } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../theme';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';

export interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: ComponentProps<typeof Feather>['name'];
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  iconName = 'inbox',
  actionTitle,
  onActionPress,
  style,
}) => {
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      {/* Icon Circle */}
      <View style={[styles.iconWrapper, { backgroundColor: colors.backgroundSecondary }]}>
        <Feather name={iconName} size={36} color={colors.textSecondary} />
      </View>

      {/* Info text */}
      <AppText variant="h2" align="center" style={[styles.title, { color: colors.text }]}>
        {title}
      </AppText>
      
      <AppText variant="bodyMd" align="center" style={[styles.description, { color: colors.textSecondary }]}>
        {description}
      </AppText>

      {/* Action Button */}
      {actionTitle && onActionPress && (
        <AppButton
          title={actionTitle}
          onPress={onActionPress}
          variant="secondary"
          size="md"
          style={styles.actionBtn}
        />
      )}
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
    marginBottom: 20,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    maxWidth: '85%',
  },
  actionBtn: {
    minWidth: 150,
  },
});