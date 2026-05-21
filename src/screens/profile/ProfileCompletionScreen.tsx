/**
 * ProfileCompletionScreen — Shows after Step 1 is complete
 * Displays completion percentage, summary, and motivational UI.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, MotiText } from 'moti';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { useColors, useTheme } from '../../theme';
import { COPY } from '../../constants/copy';
import { useOnboardingStore } from '../../store/onboardingStore';
import { getTrackableSteps } from '../../constants/onboardingSteps';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';

const { width } = Dimensions.get('window');

interface ProfileCompletionScreenProps {
  onContinue: () => void;
}

export const ProfileCompletionScreen: React.FC<ProfileCompletionScreenProps> = ({ onContinue }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { completedSteps, formData } = useOnboardingStore();

  const trackable = getTrackableSteps();
  const completedTrackable = trackable.filter(s => completedSteps.includes(s.id));
  const completionPct = Math.round((completedTrackable.length / trackable.length) * 100);

  // Get display string for employment type
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

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Celebration Header */}
          <MotiView
            from={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 1500 }}
            style={styles.celebrationContainer}
          >
            <View style={[styles.progressRingOuter, { borderColor: colors.success + '20' }]}>
              <View style={[styles.progressRingInner, { backgroundColor: colors.successLight }]}>
                <MotiText
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 500 }}
                  style={[styles.percentText, { color: colors.success }]}
                >
                  {completionPct}%
                </MotiText>
                <AppText variant="caption" style={{ color: colors.success, fontWeight: 'bold' }}>
                  COMPLETE
                </AppText>
              </View>
            </View>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300, type: 'timing', duration: 600 }}
            style={styles.textContainer}
          >
            <AppText variant="h1" style={styles.title}>
              Profile Setup Complete!
            </AppText>
            <AppText variant="bodyLg" style={[styles.subtitle, { color: colors.textSecondary }]}>
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
            <AppCard variant="elevated" padding="lg" style={styles.summaryCard}>
              <AppText variant="h3" style={styles.summaryTitle}>
                Verified Details
              </AppText>

              <View style={styles.detailRow}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <View style={styles.detailTextContainer}>
                  <AppText variant="bodySm" style={{ color: colors.textSecondary }}>
                    Full Name (PAN)
                  </AppText>
                  <AppText variant="bodyMd" style={{ color: colors.text, fontWeight: '600' }}>
                    {formData.panValidation?.name || 'Not Available'}
                  </AppText>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <View style={styles.detailTextContainer}>
                  <AppText variant="bodySm" style={{ color: colors.textSecondary }}>
                    PAN Number
                  </AppText>
                  <AppText variant="bodyMd" style={{ color: colors.text, fontWeight: '600', textTransform: 'uppercase' }}>
                    {formData.panNumber ? `${formData.panNumber.substring(0, 5)}XXXX${formData.panNumber.substring(9)}` : 'Not Available'}
                  </AppText>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <View style={styles.detailTextContainer}>
                  <AppText variant="bodySm" style={{ color: colors.textSecondary }}>
                    Employment Type
                  </AppText>
                  <AppText variant="bodyMd" style={{ color: colors.text, fontWeight: '600' }}>
                    {getEmploymentLabel()}
                  </AppText>
                </View>
              </View>

              {formData.companyName && (
                <View style={styles.detailRow}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  <View style={styles.detailTextContainer}>
                    <AppText variant="bodySm" style={{ color: colors.textSecondary }}>
                      Company
                    </AppText>
                    <AppText variant="bodyMd" style={{ color: colors.text, fontWeight: '600' }}>
                      {formData.companyName}
                    </AppText>
                  </View>
                </View>
              )}

              {formData.workAddress && (
                <View style={styles.detailRow}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  <View style={styles.detailTextContainer}>
                    <AppText variant="bodySm" style={{ color: colors.textSecondary }}>
                      Work Address
                    </AppText>
                    <AppText variant="bodyMd" style={{ color: colors.text }}>
                      {formData.workAddress.flatNo}, {formData.workAddress.city}
                    </AppText>
                  </View>
                </View>
              )}

              {formData.personalAddress && (
                <View style={styles.detailRow}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  <View style={styles.detailTextContainer}>
                    <AppText variant="bodySm" style={{ color: colors.textSecondary }}>
                      Home Address
                    </AppText>
                    <AppText variant="bodyMd" style={{ color: colors.text }}>
                      {formData.personalAddress.flatNo}, {formData.personalAddress.city}
                    </AppText>
                  </View>
                </View>
              )}
            </AppCard>
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
    paddingTop: 40,
    alignItems: 'center',
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressRingOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  cardContainer: {
    width: '100%',
    marginBottom: 32,
  },
  summaryCard: {
    width: '100%',
  },
  summaryTitle: {
    marginBottom: 16,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  actionContainer: {
    width: '100%',
    marginBottom: 40,
  },
  button: {
    width: '100%',
  },
});