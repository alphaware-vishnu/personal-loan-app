import React, { useState, useEffect } from 'react';
import {
  View, ScrollView, KeyboardAvoidingView,
  Platform, StyleSheet, ActivityIndicator,
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
import { getCustomerProfile, updateCustomerProfile } from '../../services/customerService';
import { useAuthStore } from '../../store/authStore';

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

  const [panNumber, setPanNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [panData, setPanData] = useState<PanValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const customerId = useAuthStore.getState().authData?.customerId || 99999;
      setIsProfileLoading(true);
      try {
        const profile = await getCustomerProfile(customerId);
        if (profile && profile.success && profile.data) {
          const data = profile.data;
          if (data.borrowerName) {
            // voterId is backend field for PAN (represented as voterId in backend, panNumber locally)
            const mappedPan = data.voterId || formData.panNumber || '';
            updateFormData({
              panNumber: mappedPan,
              applicantName: data.borrowerName,
              dateOfBirth: data.dob,
              gender: data.gender,
            });
            setPanNumber(mappedPan);
            setPanData({
              isValid: true,
              panNumber: mappedPan,
              name: data.borrowerName,
              dateOfBirth: data.dob || '',
              gender: data.gender || 'MALE',
            });
            setIsVerified(true);
          } else {
            setIsVerified(false);
            setPanData(null);
          }
        }
      } catch (err) {
        console.error('[PAN Verification] Failed to load profile:', err);
      } finally {
        setIsProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase());

  const handleVerifyPan = async () => {
    if (!isPanValid) return;

    setIsVerifying(true);
    setError(null);
    trackEvent('pan_submitted', { pan_prefix: panNumber.slice(0, 5) });

    try {
      const result = await validatePan(panNumber);

      if (result.isValid && result.name && result.name.trim().length > 0) {
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

        const customerId = useAuthStore.getState().authData?.customerId || 99999;
        await updateCustomerProfile({
          id: customerId,
          borrowerName: result.name,
          dob: result.dateOfBirth,
          gender: result.gender,
          voterId: result.panNumber,
        });
      } else {
        setIsVerified(false);
        setPanData(null);
        if (!result.isValid) {
          setError('Invalid PAN number. Please try again.');
        } else {
          setError('Name not found in PAN database. Please check and enter again.');
        }
        trackEvent('pan_failed');
      }
    } catch (err: any) {
      setIsVerified(false);
      setPanData(null);
      setError(err.message || 'PAN verification failed. Please try again.');
      trackEvent('pan_failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleContinue = async () => {
    const customerId = useAuthStore.getState().authData?.customerId || 99999;
    setIsVerifying(true);
    setError(null);
    try {
      await updateCustomerProfile({
        id: customerId,
        borrowerName: panData?.name || formData.applicantName || '',
        dob: panData?.dateOfBirth || formData.dateOfBirth || '',
        gender: panData?.gender || formData.gender || 'MALE',
        voterId: panData?.panNumber || formData.panNumber || '',
      });
      completeStep('pan_verification');
      onNext();
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isProfileLoading) {
    return (
      <ScreenWrapper>
        <SafeHeader title="Identity Verification" onBack={onBack} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <SafeHeader title="Identity Verification" onBack={onBack} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <StepIndicator totalSteps={4} currentStep={0} showLabel stageName="Profile Setup" />

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.content}
          >
            {/* Header Icon */}
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(79, 70, 229, 0.12)'
                    : colors.primaryLight,
                  borderColor: isDark
                    ? 'rgba(79, 70, 229, 0.2)'
                    : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <Ionicons name="card" size={32} color={colors.primary} />
            </View>

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
              success={isVerified}
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

            {isVerified && panData && (
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                style={[
                  styles.idCard,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.02)'
                      : colors.surface,
                    borderColor: isDark
                      ? 'rgba(16,185,129,0.2)'
                      : 'rgba(16,185,129,0.15)',
                    shadowColor: colors.shadow,
                  },
                ]}
              >
                {/* Badge header */}
                <View
                  style={[
                    styles.cardHeader,
                    {
                      backgroundColor: isDark
                        ? 'rgba(16,185,129,0.06)'
                        : 'rgba(16,185,129,0.03)',
                    },
                  ]}
                >
                  <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                  <AppText
                    variant="labelSm"
                    style={{ color: colors.success, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    NSDL Securely Verified
                  </AppText>
                </View>

                {/* Card fields */}
                <View style={[styles.cardBody, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : colors.borderLight }]}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardCol}>
                      <AppText
                        variant="caption"
                        style={{ color: colors.textSecondary, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }}
                      >
                        Full Name
                      </AppText>
                      <AppText
                        variant="bodyLg"
                        style={{ fontWeight: '700', color: colors.text, marginTop: 4 }}
                      >
                        {panData.name}
                      </AppText>
                    </View>
                  </View>

                  <View style={[styles.cardRow, { marginTop: 16 }]}>
                    <View style={styles.cardCol}>
                      <AppText
                        variant="caption"
                        style={{ color: colors.textSecondary, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }}
                      >
                        Date of Birth
                      </AppText>
                      <AppText
                        variant="bodyMd"
                        style={{ fontWeight: '600', color: colors.text, marginTop: 4 }}
                      >
                        {panData.dateOfBirth}
                      </AppText>
                    </View>

                    <View style={styles.cardCol}>
                      <AppText
                        variant="caption"
                        style={{ color: colors.textSecondary, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }}
                      >
                        Gender
                      </AppText>
                      <AppText
                        variant="bodyMd"
                        style={{ fontWeight: '600', color: colors.text, marginTop: 4 }}
                      >
                        {panData.gender}
                      </AppText>
                    </View>
                  </View>
                </View>
              </MotiView>
            )}
          </MotiView>
        </ScrollView>

        {/* Footer CTA Section */}
        <View style={[styles.footer, { borderTopColor: colors.borderLight, backgroundColor: colors.background }]}>
          <View style={styles.trustBadgeContainer}>
            <Ionicons name="lock-closed" size={12} color={colors.success} />
            <AppText variant="caption" style={{ color: colors.textSecondary, fontSize: 11 }}>
              Secure 256-bit SSL encrypted connection
            </AppText>
          </View>

          {!isVerified ? (
            <AppButton
              title={COPY.pan.cta}
              onPress={handleVerifyPan}
              disabled={!isPanValid}
              loading={isVerifying}
              style={styles.actionButton}
            />
          ) : (
            <AppButton
              title="Continue"
              onPress={handleContinue}
              style={styles.actionButton}
              icon={<Ionicons name="arrow-forward" size={16} color="#FFFFFF" />}
              iconPosition="right"
            />
          )}
        </View>
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
    paddingHorizontal: 0, // ScreenWrapper handles horizontal padding
    paddingTop: 16,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  idCard: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  cardBody: {
    padding: 16,
    borderTopWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardCol: {
    flex: 1,
  },
  trustBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 4,
  },
  footer: {
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    width: '100%',
  },
});
