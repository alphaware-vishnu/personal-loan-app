/**
 * EmploymentTypePicker — Visual card-based employment type selector
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTheme } from '../../theme';
import { EMPLOYMENT_TYPES, type EmploymentType } from '../../constants/onboardingSteps';

interface EmploymentTypePickerProps {
  /** Currently selected type */
  selected: EmploymentType | null;
  /** Selection callback */
  onSelect: (type: EmploymentType) => void;
}

export const EmploymentTypePicker: React.FC<EmploymentTypePickerProps> = ({
  selected,
  onSelect,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {EMPLOYMENT_TYPES.map((type, index) => {
        const isSelected = selected === type.id;

        return (
          <MotiView
            key={type.id}
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: index * 100 }}
          >
            <TouchableOpacity
              style={[
                styles.card,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primaryLight
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.borderLight,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => onSelect(type.id)}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary + '15'
                      : theme.colors.backgroundTertiary,
                  },
                ]}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                />
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {type.title}
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  {type.subtitle}
                </Text>
              </View>

              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radioOutline,
                    {
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioDot,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </MotiView>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
  },
  radioContainer: {
    marginLeft: 12,
  },
  radioOutline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
