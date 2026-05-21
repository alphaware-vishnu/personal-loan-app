import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useTheme } from '../../theme';
import { AppText } from './AppText';
import { AppButton } from './AppButton';

const { width } = Dimensions.get('window');

export interface PermissionItem {
  key: string;
  icon: keyof typeof Ionicons.prototype.props.name;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface PermissionCardProps {
  permission: PermissionItem;
  stepIndex: number;
  totalSteps: number;
  onAllow: () => void;
  onSkip: () => void;
  loading: boolean;
}

export const PermissionCard: React.FC<PermissionCardProps> = ({
  permission,
  stepIndex,
  totalSteps,
  onAllow,
  onSkip,
  loading,
}) => {
  const colors = useColors();
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isCompleted = i < stepIndex;
          const isActive = i === stepIndex;
          
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: isCompleted
                    ? colors.primary
                    : isActive
                    ? colors.primary
                    : colors.border,
                  opacity: isActive ? 1 : isCompleted ? 0.8 : 0.3,
                  width: isActive ? 18 : 6,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Hero Icon Section */}
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.iconOuter,
            {
              borderColor: permission.iconColor + '15',
              backgroundColor: theme.mode === 'light' ? permission.iconBg : 'rgba(255,255,255,0.05)',
            },
          ]}
        >
          <Ionicons name={permission.icon as any} size={48} color={permission.iconColor} />
        </View>
      </View>

      {/* Text Info */}
      <View style={styles.textContainer}>
        <AppText variant="h2" style={[styles.title, { color: colors.text }]}>
          {permission.title}
        </AppText>
        <AppText variant="bodyMedium" style={[styles.subtitle, { color: colors.textSecondary }]}>
          {permission.subtitle}
        </AppText>
        <AppText variant="caption" style={[styles.description, { color: colors.textTertiary }]}>
          {permission.description}
        </AppText>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <AppButton
          title="Grant Permission"
          onPress={onAllow}
          loading={loading}
          style={styles.allowButton}
        />
        <AppButton
          title="Maybe Later"
          onPress={onSkip}
          variant="ghost"
          style={styles.skipButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 32,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  allowButton: {
    width: '100%',
  },
  skipButton: {
    width: '100%',
  },
});