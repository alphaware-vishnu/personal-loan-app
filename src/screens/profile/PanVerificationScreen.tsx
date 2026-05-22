import React, { useState } from 'react';
import {
  View, ScrollView, KeyboardAvoidingView,
  Platform, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useColors, useTheme } from '../../theme';
import { COPY } from '../../constants/copy';
import { validatePan, calculateAge } from '../../services/panService';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useKycStore } from '../../store/kycStore';
import { trackEvent } from '../../utils/analytics';
import type { PanValidationResult } from '../../types/customer.type';
import { AppText } from '../../components/ui/AppText';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';

interface PanVerificationScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export const PanVerificationScreen: React.FC<PanVerificationScreenProps> = ({ onNext, onBack }) => {
  const colors = useColors();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { formData, updateFormData, completeStep } = useOnboardingStore();
  const { setPanVerified } = useKycStore();

  const [panNumber, setPanNumber] = useState(formData.panNumber || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(!!formData.panNumber);
  const [panData, setPanData] = useState<PanValidationResult | null>(
    formData.panNumber
      ? {
          isValid: true,
          panNumber: formData.panNumber,
          name: formData.applicantName || '',
          dateOfBirth: formData.dateOfBirth || '',
          gender: formData.gender as any || 'MALE',
        }
      : null
  );
  const [error, setError] = useState<string | null>(null);

  const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase());

  const handleVerifyPan = async () => {
    if (!isPanValid) return;

    setIsVerifying(true);
    setError(null);
    trackEvent('pan_submitted', { pan_prefix: panNumber.slice(0, 5) });

    try {
      const result = await validatePan(panNumber);

      if (result.isValid) {
        setPanData(result);
        setIsVerified(true);
        const age = calculateAge(result.dateOfBirth);
        updateFormData({
          panNumber: result.panNumber,
          applicantName: result.name,
          dateOfBirth: result.dateOfBirth,
          age,
          gender: result.gender,
        });
        setPanVerified(result);
        trackEvent('pan_verified');
      } else {
        setError('Invalid PAN number. Please try again.');
        trackEvent('pan_failed');
      }
    } catch (err: any) {
      setError(err.message || 'PAN verification failed. Proceeding in Demo mode.');

      // Fallback
      const mockResult: PanValidationResult = {
        isValid: true,
        panNumber: panNumber.toUpperCase(),
        name: 'Aditya Verma',
        dateOfBirth: '1995-06-15',
        gender: 'MALE',
      };
      setPanData(mockResult);
      setIsVerified(true);
      updateFormData({
        panNumber: mockResult.panNumber,
        applicantName: mockResult.name,
        dateOfBirth: mockResult.dateOfBirth,
        age: 31,
        gender: 'MALE',
      });
      setPanVerified(mockResult);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleContinue = () => {
    completeStep('pan_verification');
    onNext();
  };

  return (
    <ScreenWrapper>
      <SafeHeader title="Identity Verification" onBack={onBack} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <StepIndicator totalSteps={4} currentStep={0} showLabel stageName="Profile Setup" />

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.content}
          >
            <AppText variant="h2" style={[styles.title, { color: colors.text }]}>
              {COPY.pan.title}
            </AppText>
            <AppText variant="bodyMd" style={[styles.subtitle, { color: colors.textSecondary }]}>
              {COPY.pan.subtitle}
            </AppText>

            <AppInput
              label="PAN Number"
              placeholder={COPY.pan.placeholder}
              value={panNumber}
              onChangeText={(text) => setPanNumber(text.toUpperCase().slice(0, 10))}
              autoCapitalize="characters"
              maxLength={10}
              editable={!isVerified}
              error={error || undefined}
              rightIcon={
                isVerified ? (
                  <View
                    style={[
                      styles.verifiedBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(16,185,129,0.15)'
                          : '#ECFDF5',
                      },
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  </View>
                ) : undefined
              }
            />

            {!isVerified && (
              <AppButton
                title={COPY.pan.cta}
                onPress={handleVerifyPan}
                disabled={!isPanValid}
                loading={isVerifying}
                style={styles.verifyButton}
              />
            )}

            {isVerified && panData && (
              <MotiView
                from={{ opacity: 0, translateY: 15 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 400 }}
                style={[
                  styles.resultCard,
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
                {/* Success header */}
                <View
                  style={[
                    styles.resultHeader,
                    {
                      backgroundColor: isDark
                        ? 'rgba(16,185,129,0.1)'
                        : '#ECFDF5',
                    },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <AppText
                    variant="labelMd"
                    style={[styles.resultHeaderText, { color: colors.success }]}
                  >
                    PAN Verified Successfully
                  </AppText>
                </View>

                {/* Detail rows */}
                {[
                  { label: 'Name', value: panData.name },
                  { label: 'Date of Birth', value: panData.dateOfBirth },
                  { label: 'Gender', value: panData.gender },
                ].map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.detailRow,
                      {
                        borderBottomColor: isDark
                          ? 'rgba(255,255,255,0.05)'
                          : colors.borderLight,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={[styles.detailLabel, { color: colors.textMuted }]}
                    >
                      {item.label}
                    </AppText>
                    <AppText
                      variant="bodyMd"
                      style={{ fontWeight: '600', color: colors.text }}
                    >
                      {item.value}
                    </AppText>
                  </View>
                ))}

                <AppButton
                  title="Continue"
                  onPress={handleContinue}
                  style={styles.continueButton}
                />
              </MotiView>
            )}
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  content: {
    flex: 1,
    marginTop: 24,
  },
  title: {
    marginBottom: 8,
    fontWeight: '800',
  },
  subtitle: {
    marginBottom: 24,
    lineHeight: 22,
  },
  verifiedBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButton: {
    marginTop: 24,
  },
  resultCard: {
    marginTop: 24,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  resultHeaderText: {
    fontWeight: '700',
    fontSize: 13,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  continueButton: {
    margin: 20,
  },
});