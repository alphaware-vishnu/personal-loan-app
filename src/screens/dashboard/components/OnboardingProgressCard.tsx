import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useColors, useTheme } from '../../../theme';
import { useOnboardingStore } from '../../../store/onboardingStore';
import { getTrackableSteps, OnboardingStepId } from '../../../constants/onboardingSteps';
import { AppText } from '../../../components/ui/AppText';

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

const GROUP_TO_STAGE: Record<string, string> = {
  profile: 'Profile Setup',
  eligibility: 'Eligibility Check',
  kyc: 'KYC Verification',
  offer: 'Personalized Offer',
  bank_verification: 'Bank Verification',
  loan_agreement: 'Loan Agreement',
  disbursal: 'Loan Disbursal',
};

interface OnboardingProgressCardProps {
  onResume: (screen: any) => void;
}

export const OnboardingProgressCard: React.FC<OnboardingProgressCardProps> = React.memo(({ onResume }) => {
  const colors = useColors();
  const { mode } = useTheme();
  const { completedSteps } = useOnboardingStore();
  const isDark = mode === 'dark';

  const trackableSteps = getTrackableSteps().filter((step) => step.isEnabled);
  const totalSteps = trackableSteps.length;
  const completedCount = trackableSteps.filter((step) => completedSteps.includes(step.id)).length;
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  // Find the first incomplete step
  const nextStep = trackableSteps.find((step) => !completedSteps.includes(step.id));
  const nextFlowTarget = nextStep ? STEP_TO_FLOW[nextStep.id] : 'dashboard';
  const stageName = nextStep ? (GROUP_TO_STAGE[nextStep.group] || nextStep.group) : '';

  const handleResume = () => {
    onResume(nextFlowTarget);
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handleResume} style={styles.touchable}>
      <LinearGradient
        colors={isDark ? ['#1e1b4b', '#111827'] : ['#f5f3ff', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          {
            borderColor: isDark ? '#312e81' : '#e0e7ff',
            shadowColor: colors.primary,
          },
        ]}
      >
        <View style={styles.cardRow}>
          <View style={styles.leftContent}>
            {/* Badge Row */}
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.08)' },
                ]}
              >
                <AppText variant="caption" style={{ color: colors.primary, fontWeight: '800', fontSize: 8 }}>
                  {stageName ? stageName.toUpperCase() : 'ONBOARDING'}
                </AppText>
              </View>
              <AppText variant="caption" style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
                {completedCount} of {totalSteps} Steps
              </AppText>
            </View>

            {/* Title */}
            <AppText variant="bodyMd" style={[styles.title, { color: colors.text }]}>
              Resume Loan Application
            </AppText>

            {/* Next Step Info */}
            {nextStep && (
              <AppText variant="caption" numberOfLines={1} style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                Next: <AppText variant="caption" style={{ color: colors.text, fontWeight: '800' }}>{nextStep.title}</AppText>
              </AppText>
            )}

            {/* Compact Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
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
              <AppText variant="caption" style={{ color: colors.primary, fontWeight: '800', fontSize: 10, marginLeft: 8 }}>
                {Math.round(progressPercent)}%
              </AppText>
            </View>
          </View>

          {/* Pulsing Play Button */}
          <MotiView
            from={{ scale: 0.95 }}
            animate={{ scale: 1.05 }}
            transition={{
              type: 'timing',
              duration: 1500,
              loop: true,
            }}
            style={[styles.resumeCircle, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="play" size={18} color="white" style={{ marginLeft: 2 }} />
          </MotiView>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  touchable: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    marginRight: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressBg: {
    height: 5,
    borderRadius: 3,
    flex: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  resumeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
});
