/**
 * ProfileCompletionScreen — Fibe-inspired celebration screen
 * Displays completion percentage, summary card, and motivational UI.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { useColors, useTheme } from '../../theme';
import { COPY } from '../../constants/copy';
import { useOnboardingStore } from '../../store/onboardingStore';
import { getTrackableSteps } from '../../constants/onboardingSteps';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';

const { width } = Dimensions.get('window');

interface ProfileCompletionScreenProps {
  onContinue: () => void;
}

export const ProfileCompletionScreen: React.FC<ProfileCompletionScreenProps> = ({ onContinue }) => {
  const colors = useColors();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { completedSteps, formData } = useOnboardingStore();

  const trackable = getTrackableSteps();
  const completedTrackable = trackable.filter(s => completedSteps.includes(s.id));
  const completionPct = Math.round((completedTrackable.length / trackable.length) * 100);

  const getEmploymentLabel = () => {
    switch (formData.employmentType) {
      case 'salaried':
        return 'Salaried';
      case 'self_employed':
        return 'Self-Employed';
      case 'freelancer':
        return 'Freelancer';
      case 'business_owner':
        return 'Business Owner';
      default:
        return 'Not Specified';
    }
  };

  const detailItems = [
    {
      label: 'Full Name (PAN)',
      value: formData.panValidation?.name || 'Not Available',
      icon: 'person',
    },
    {
      label: 'PAN Number',
      value: formData.panNumber
        ? `${formData.panNumber.substring(0, 5)}XXXX${formData.panNumber.substring(9)}`
        : 'Not Available',
      icon: 'card',
    },
    {
      label: 'Employment Type',
      value: getEmploymentLabel(),
      icon: 'briefcase',
    },
    ...(formData.companyName
      ? [{ label: 'Company', value: formData.companyName, icon: 'business' }]
      : []),
    ...(formData.workAddress
      ? [
          {
            label: 'Work Address',
            value: `${formData.workAddress.flatNo}, ${formData.workAddress.city}`,
            icon: 'location',
          },
        ]
      : []),
    ...(formData.personalAddress
      ? [
          {
            label: 'Home Address',
            value: `${formData.personalAddress.flatNo}, ${formData.personalAddress.city}`,
            icon: 'home',
          },
        ]
      : []),
  ];

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Celebration Badge */}
          <MotiView
            from={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 1200 }}
            style={styles.celebrationContainer}
          >
            <View
              style={[
                styles.celebrationOuter,
                {
                  backgroundColor: isDark
                    ? 'rgba(16,185,129,0.08)'
                    : '#ECFDF5',
                  borderColor: isDark
                    ? 'rgba(16,185,129,0.15)'
                    : '#D1FAE5',
                },
              ]}
            >
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)']
                    : ['#ECFDF5', '#D1FAE5']
                }
                style={styles.celebrationInner}
              >
                <Ionicons name="checkmark-circle" size={36} color={colors.success} />
                <MotiText
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 500 }}
                  style={[styles.percentText, { color: colors.success }]}
                >
                  {completionPct}%
                </MotiText>
                <AppText
                  variant="caption"
                  style={[styles.completeLabel, { color: colors.success }]}
                >
                  COMPLETE
                </AppText>
              </LinearGradient>
            </View>
          </MotiView>

          {/* Title */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300, type: 'timing', duration: 600 }}
            style={styles.textContainer}
          >
            <AppText variant="h1" style={[styles.title, { color: colors.text }]}>
              Profile Setup Complete!
            </AppText>
            <AppText
              variant="bodyMd"
              style={[styles.subtitle, { color: colors.textSecondary }]}
            >
              You have completed Step 1 of your application. Great job!
            </AppText>
          </MotiView>

          {/* Summary Card */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 500, type: 'timing', duration: 600 }}
            style={styles.cardContainer}
          >
            <View
              style={[
                styles.summaryCard,
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
              <AppText
                variant="h3"
                style={[styles.summaryTitle, { color: colors.text }]}
              >
                Verified Details
              </AppText>

              {detailItems.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.detailRow,
                    {
                      borderBottomColor: isDark
                        ? 'rgba(255,255,255,0.05)'
                        : colors.borderLight,
                      borderBottomWidth:
                        idx < detailItems.length - 1
                          ? StyleSheet.hairlineWidth
                          : 0,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.detailIconBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(16,185,129,0.1)'
                          : '#ECFDF5',
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={16}
                      color={colors.success}
                    />
                  </View>
                  <View style={styles.detailTextContainer}>
                    <AppText
                      variant="caption"
                      style={[styles.detailLabel, { color: colors.textMuted }]}
                    >
                      {item.label}
                    </AppText>
                    <AppText
                      variant="bodyMd"
                      style={{
                        color: colors.text,
                        fontWeight: '600',
                        fontSize: 14,
                      }}
                    >
                      {item.value}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          </MotiView>

          {/* Action button */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 700, type: 'timing', duration: 600 }}
            style={styles.actionContainer}
          >
            <AppButton
              title="Continue to Income Setup"
              onPress={onContinue}
              style={styles.button}
            />
          </MotiView>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    alignItems: 'center',
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  celebrationOuter: {
    width: 140,
    height: 140,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationInner: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 4,
  },
  completeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '800',
    fontSize: 26,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  cardContainer: {
    width: '100%',
    marginBottom: 28,
  },
  summaryCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  summaryTitle: {
    marginBottom: 18,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  actionContainer: {
    width: '100%',
    marginBottom: 40,
  },
  button: {
    width: '100%',
  },
});