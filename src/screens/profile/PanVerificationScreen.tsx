import React, { useState, useEffect } from 'react';
import {
  View, ScrollView, KeyboardAvoidingView,
  Platform, StyleSheet, TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { ILLUSTRATIONS } from '../../assets/illustrations';
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
import { LoadingState } from '../../components/feedback/LoadingState';

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

  const [dobInput, setDobInput] = useState('');
  const [genderInput, setGenderInput] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [dobError, setDobError] = useState<string | null>(null);
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setDobInput(formattedDate);
    }
  };

  useEffect(() => {
    if (dobInput.length === 10) {
      const d = new Date(dobInput);
      if (isNaN(d.getTime())) {
        setDobError('Invalid date format (YYYY-MM-DD).');
        setCalculatedAge(null);
      } else if (d > new Date()) {
        setDobError('Cannot be a future date.');
        setCalculatedAge(null);
      } else {
        const age = calculateAge(dobInput);
        setCalculatedAge(age);
        if (age < 18) {
          setDobError('Age must be at least 18.');
        } else {
          setDobError(null);
        }
      }
    } else if (dobInput.length > 0) {
      setDobError('Enter date as YYYY-MM-DD.');
      setCalculatedAge(null);
    } else {
      setDobError(null);
      setCalculatedAge(null);
    }
  }, [dobInput]);

  useEffect(() => {
    const loadProfile = async () => {
      const customerId = useAuthStore.getState().authData?.customerId || 99999;
      setIsProfileLoading(true);
      try {
        const profile = await getCustomerProfile(customerId);
        if (profile && profile.data) {
          const data = profile.data;
          if (data.borrowerName) {
            // panNumber is backend field for PAN (represented as panNumber locally and backend)
            const mappedPan = data.panNumber || formData.panNumber || '';
            updateFormData({
              panNumber: mappedPan,
              applicantName: data.borrowerName,
              dateOfBirth: data.dob,
              gender: data.gender,
            });
            setPanNumber(mappedPan);
            
            // Validate the PAN again when on this screen even if populated
            if (mappedPan && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(mappedPan.toUpperCase())) {
              try {
                const result = await validatePan(mappedPan);
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
                  setDobInput(result.dateOfBirth || '');
                  setGenderInput(result.gender || 'MALE');
                  
                  await updateCustomerProfile({
                    borrowerName: result.name,
                    dob: result.dateOfBirth,
                    gender: result.gender,
                    panNumber: result.panNumber,
                  });
                } else {
                  setIsVerified(false);
                  setPanData(null);
                }
              } catch (e) {
                console.error('[PAN Verification] auto-validation failed:', e);
                setIsVerified(false);
                setPanData(null);
              }
            } else {
              setIsVerified(false);
              setPanData(null);
            }
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

        setDobInput(result.dateOfBirth || '');
        setGenderInput(result.gender || 'MALE');

        const customerId = useAuthStore.getState().authData?.customerId || 99999;
        await updateCustomerProfile({
          // id: customerId,
          borrowerName: result.name,
          dob: result.dateOfBirth,
          gender: result.gender,
          panNumber: result.panNumber,
        });

        const profile = await getCustomerProfile(customerId);
        if (profile && profile.data) {
          updateFormData({
            panNumber: profile.data.panNumber || result.panNumber,
            applicantName: profile.data.borrowerName || result.name,
            dateOfBirth: profile.data.dob || result.dateOfBirth,
            gender: profile.data.gender || result.gender,
          });
        }
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
        // id: customerId,
        borrowerName: panData?.name || formData.applicantName || '',
        dob: dobInput || formData.dateOfBirth || '',
        gender: genderInput || formData.gender || 'MALE',
        panNumber: panData?.panNumber || formData.panNumber || '',
      });

      const profile = await getCustomerProfile(customerId);
      if (profile && profile.data) {
        updateFormData({
          panNumber: profile.data.panNumber || panData?.panNumber || formData.panNumber || '',
          applicantName: profile.data.borrowerName || panData?.name || formData.applicantName || '',
          dateOfBirth: dobInput || profile.data.dob || formData.dateOfBirth || '',
          gender: genderInput || profile.data.gender || formData.gender || 'MALE',
          age: calculatedAge || undefined,
        });
      }
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
        <LoadingState message="Loading profile details..." fullScreen={false} />
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
            {/* Header Illustration */}
            <View style={styles.illustrationContainer}>
              <MotiView
                key={isVerified ? 'verified' : 'unverified'}
                from={{ opacity: 0, scale: 0.9, rotate: '-3deg', translateY: 10 }}
                animate={{ opacity: 1, scale: 1, rotate: '0deg', translateY: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                style={styles.illustrationWrapper}
              >
                <SvgXml
                  xml={isVerified ? ILLUSTRATIONS.certification : ILLUSTRATIONS.dataInput}
                  width="100%"
                  height="100%"
                />
              </MotiView>
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
              <>
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
                      <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                        <View pointerEvents="none">
                          <AppInput
                            label="Date of Birth"
                            placeholder="Select Date"
                            value={dobInput}
                            editable={false}
                            error={dobError || undefined}
                          />
                        </View>
                      </TouchableOpacity>
                      {showDatePicker && (
                        <DateTimePicker
                          value={dobInput.length === 10 && !isNaN(new Date(dobInput).getTime()) ? new Date(dobInput) : new Date()}
                          mode="date"
                          display="default"
                          maximumDate={new Date()}
                          onChange={handleDateChange}
                        />
                      )}
                      {calculatedAge !== null && calculatedAge >= 0 && !dobError && (
                        <AppText variant="caption" style={{ color: colors.success, marginTop: 4 }}>
                          Derived Age: {calculatedAge} years
                        </AppText>
                      )}
                    </View>
                  </View>

                  <View style={[styles.cardRow, { marginTop: 16 }]}>
                    <View style={styles.cardCol}>
                      <AppText
                        variant="caption"
                        style={{ color: colors.textSecondary, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, marginBottom: 8 }}
                      >
                        Gender
                      </AppText>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                          <TouchableOpacity
                            key={g}
                            onPress={() => setGenderInput(g as any)}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: genderInput === g ? colors.primary : colors.borderLight,
                              backgroundColor: genderInput === g ? (isDark ? 'rgba(16,185,129,0.1)' : '#EFF6FF') : 'transparent',
                            }}
                          >
                            <AppText variant="bodySm" style={{ color: genderInput === g ? colors.primary : colors.text, fontWeight: genderInput === g ? '600' : '400' }}>
                              {g.charAt(0) + g.slice(1).toLowerCase()}
                            </AppText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              </>
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
              disabled={!!dobError || dobInput.length !== 10 || (calculatedAge ?? 0) < 18}
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
  illustrationContainer: {
    height: 180,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  illustrationWrapper: {
    width: 220,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
