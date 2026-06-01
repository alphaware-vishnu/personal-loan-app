import React from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useColors, useTheme } from '../../theme';
import { AppText } from './AppText';
import { AppButton } from './AppButton';

const { width } = Dimensions.get('window');

export interface PermissionItem {
  key: string;
  icon?: keyof typeof Ionicons.prototype.props.name;
  illustration?: any;
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
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500 }}
      key={permission.key}
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? 'rgba(255,255,255,0.04)'
            : colors.surface,
          borderColor: isDark
            ? 'rgba(255,255,255,0.06)'
            : colors.border,
        },
      ]}
    >
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isCompleted = i < stepIndex;
          const isActive = i === stepIndex;

          return (
            <MotiView
              key={i}
              animate={{
                width: isActive ? 22 : 7,
                opacity: isActive ? 1 : isCompleted ? 0.7 : 0.2,
              }}
              transition={{ type: 'timing', duration: 300 }}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    isCompleted || isActive
                      ? colors.primary
                      : isDark
                      ? 'rgba(255,255,255,0.15)'
                      : colors.border,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Hero Icon Section */}
      <View style={styles.iconContainer}>
        {/* Outer glow ring (dark mode) / shadow ring (light mode) */}
        <View
          style={[
            styles.iconGlow,
            {
              backgroundColor: isDark
                ? `${permission.iconColor}10`
                : `${permission.iconColor}08`,
            },
          ]}
        />

        <MotiView
          from={{ scale: 0.8, opacity: 0, translateY: 10 }}
          animate={{ scale: 1, opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 200, damping: 15 }}
          style={permission.illustration ? undefined : [
            styles.iconOuter,
            {
              borderColor: isDark
                ? `${permission.iconColor}25`
                : `${permission.iconColor}15`,
              backgroundColor: isDark
                ? 'rgba(30,41,59,0.8)'
                : permission.iconBg,
            },
          ]}
        >
          {permission.illustration ? (
            <Image
              source={permission.illustration}
              style={{ width: 110, height: 110 }}
              resizeMode="contain"
            />
          ) : (
            <Ionicons
              name={permission.icon as any}
              size={44}
              color={permission.iconColor}
            />
          )}
        </MotiView>
      </View>

      {/* Text Info */}
      <View style={styles.textContainer}>
        <AppText variant="h2" style={[styles.title, { color: colors.text }]}>
          {permission.title}
        </AppText>

        <View
          style={[
            styles.subtitleBadge,
            {
              backgroundColor: isDark
                ? `${permission.iconColor}15`
                : `${permission.iconColor}12`,
            },
          ]}
        >
          <AppText
            variant="caption"
            style={[
              styles.subtitleText,
              { color: permission.iconColor },
            ]}
          >
            {permission.subtitle}
          </AppText>
        </View>

        <AppText
          variant="bodySm"
          style={[styles.description, { color: colors.textTertiary }]}
        >
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
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    alignItems: 'center',
    padding: 28,
    borderRadius: 28,
    borderWidth: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 36,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  iconOuter: {
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '800',
  },
  subtitleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 16,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 20,
    fontSize: 13,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  allowButton: {
    width: '100%',
  },
  skipButton: {
    width: '100%',
  },
});