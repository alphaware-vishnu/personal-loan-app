/**
 * StepIndicator — Fibe-inspired progress bar for onboarding steps
 * Uses segmented bar with smooth transitions instead of dots.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

interface StepIndicatorProps {
  /** Total number of steps */
  totalSteps: number;
  /** Current active step (0-indexed) */
  currentStep: number;
  /** Show step count text (e.g., "Step 2 of 5") */
  showLabel?: boolean;
  /** Active color override */
  activeColor?: string;
  /** Optional current stage name */
  stageName?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  totalSteps,
  currentStep,
  showLabel = false,
  activeColor,
  stageName,
}) => {
  const { theme, mode } = useTheme();
  const isDark = mode === 'dark';
  const active = activeColor || theme.colors.primary;

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelRow}>
          <AppText
            variant="caption"
            style={[styles.stepLabel, { color: theme.colors.textMuted }]}
          >
            {stageName ? `${stageName.toUpperCase()}  •  ` : ''}Step {currentStep + 1} of {totalSteps}
          </AppText>
          <View
            style={[
              styles.stepBadge,
              {
                backgroundColor: isDark
                  ? `${active}20`
                  : `${active}12`,
              },
            ]}
          >
            <AppText
              variant="caption"
              style={[styles.stepBadgeText, { color: active }]}
            >
              {Math.round(((currentStep + 1) / totalSteps) * 100)}%
            </AppText>
          </View>
        </View>
      )}

      <View style={styles.barContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <MotiView
              key={index}
              animate={{
                backgroundColor: isCompleted
                  ? active
                  : isActive
                  ? active
                  : isDark
                  ? 'rgba(255,255,255,0.08)'
                  : theme.colors.borderLight,
                opacity: isCompleted ? 0.7 : isActive ? 1 : 0.4,
              }}
              transition={{ type: 'timing', duration: 350 }}
              style={[
                styles.barSegment,
                index === 0 && styles.barSegmentFirst,
                index === totalSteps - 1 && styles.barSegmentLast,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barSegment: {
    flex: 1,
    height: 5,
    borderRadius: 0,
  },
  barSegmentFirst: {
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  barSegmentLast: {
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
});