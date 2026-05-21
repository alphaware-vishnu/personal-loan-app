import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useTheme } from '../../../theme';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { getTrackableSteps, OnboardingStepId } from '../../../constants/onboardingSteps';
import { AppText } from '../../../components/ui/AppText';
import { AppCard } from '../../../components/ui/AppCard';
import { AppButton } from '../../../components/ui/AppButton';

// Map OnboardingStepId to App.tsx Flow screen keys
const STEP_TO_FLOW: Record<OnboardingStepId, string> = {
  intro: 'introCarousel',
  permissions: 'permissions',
  auth: 'mobileInput',
  pan_verification: 'panVerification',
  employment: 'employmentType',
  work_address: 'workAddress',
  personal_address: 'personalAddress',
  income: 'incomeInput',
  bank_statement: 'bankStatementUpload',
  eligibility: 'eligibilityProcessing',
  kyc_aadhaar: 'aadhaarVerification',
  kyc_selfie: 'selfieVerification',
  bank_account: 'bankDetails',
  agreement: 'agreement',
  disbursal: 'disbursal',
};

interface OnboardingProgressCardProps {
  onResume: (screen: any) => void;
}

export const OnboardingProgressCard: React.FC<OnboardingProgressCardProps> = React.memo(({ onResume }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { completedSteps } = useOnboardingStore();

  const trackableSteps = getTrackableSteps().filter((step) => step.isEnabled);
  const totalSteps = trackableSteps.length;
  const completedCount = trackableSteps.filter((step) => completedSteps.includes(step.id)).length;
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  // Find the first incomplete step
  const nextStep = trackableSteps.find((step) => !completedSteps.includes(step.id));
  const nextFlowTarget = nextStep ? STEP_TO_FLOW[nextStep.id] : 'dashboard';

  const handleResume = () => {
    onResume(nextFlowTarget);
  };

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.accentLight }]}>
          <AppText variant="caption" style={{ color: colors.accentDark, fontWeight: '800' }}>
            ONBOARDING IN PROGRESS
          </AppText>
        </View>
        <AppText variant="caption" style={{ color: colors.textSecondary }}>
          {completedCount} of {totalSteps} steps completed
        </AppText>
      </View>

      <AppText variant="h2" style={styles.title}>
        Complete your profile to unlock a loan offer
      </AppText>

      {nextStep && (
        <View style={styles.nextStepBox}>
          <Ionicons name="arrow-forward-circle-outline" size={20} color={colors.primary} />
          <AppText variant="bodySm" style={[styles.nextStepText, { color: colors.textSecondary }]}>
            Next step: <AppText variant="bodySm" style={{ color: colors.text, fontWeight: '700' }}>{nextStep.title}</AppText> ({nextStep.subtitle})
          </AppText>
        </View>
      )}

      {/* Progress Bar */}
      <View style={[styles.progressBg, { backgroundColor: colors.backgroundSecondary }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${progressPercent}%`,
            },
          ]}
        />
      </View>

      <AppButton
        title="Resume Application"
        variant="primary"
        size="md"
        icon={<Ionicons name="play" size={16} color="white" />}
        onPress={handleResume}
      />
    </AppCard>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    elevation: 3,
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 24,
  },
  nextStepBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nextStepText: {
    marginLeft: 8,
    flex: 1,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
