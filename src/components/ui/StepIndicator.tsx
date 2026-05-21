/**
 * StepIndicator — Progress dots for onboarding steps
 * Supports horizontal dots and animated transitions.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '../../theme';

interface StepIndicatorProps {
  /** Total number of steps */
  totalSteps: number;
  /** Current active step (0-indexed) */
  currentStep: number;
  /** Show step count text (e.g., "Step 2 of 5") */
  showLabel?: boolean;
  /** Active color override */
  activeColor?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  totalSteps,
  currentStep,
  showLabel = false,
  activeColor,
}) => {
  const { theme } = useTheme();
  const active = activeColor || theme.colors.accent;

  return (
    <View style={styles.container}>
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <MotiView
              key={index}
              animate={{
                width: isActive ? 28 : 8,
                backgroundColor: isActive
                  ? active
                  : isCompleted
                    ? active + '80' // 50% opacity
                    : theme.colors.border,
              }}
              transition={{ type: 'timing', duration: 300 }}
              style={[styles.dot]}
            />
          );
        })}
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
  },
});