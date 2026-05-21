import React, { useState, useEffect } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, StyleSheet, View, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { MotiView } from 'moti';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useColors, useTheme } from '../../theme';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useKycStore } from '../../store/kycStore';
import { initiateAadhaarOtp, verifyAadhaarOtp } from '../../services/kycService';
import { trackEvent } from '../../utils/analytics';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { OtpInput } from '../../components/ui/OtpInput';

interface AadhaarVerificationScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export const AadhaarVerificationScreen: React.FC<AadhaarVerificationScreenProps> = ({ onNext, onBack }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { completeStep } = useOnboardingStore();
  const kycStore = useKycStore();

  const [aadhaarNum, setAadhaarNum] = useState('');
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (referenceId && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [referenceId, resendTimer]);

  useEffect(() => {
    if (otpCode.length === 6) {
      handleVerifyOtp(otpCode);
    }
  }, [otpCode]);

  const handleSendOtp = async () => {
    if (aadhaarNum.length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await initiateAadhaarOtp(aadhaarNum);
      if (response.status === 'SUCCESS') {
        setReferenceId(response.referenceId);
        setResendTimer(30);
        kycStore.setAadhaarStatus('IN_PROGRESS', response.referenceId);
        trackEvent('aadhaar_otp_requested');
      } else {
        setError(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (codeValue?: string) => {
    const code = codeValue || otpCode;
    if (code.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await verifyAadhaarOtp(referenceId!, code);
      if (res.isValid) {
        kycStore.setAadhaarStatus('VERIFIED');
        completeStep('kyc_aadhaar');
        trackEvent('aadhaar_verified');
        onNext();
      } else {
        setError('Invalid OTP code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAadhaarChange = (text: string) => {
    const formatted = text.replace(/\D/g, '');
    setAadhaarNum(formatted);
    if (formatted.length > 0 && formatted.length < 12) {
      setError('Aadhaar must be exactly 12 digits');
    } else {
      setError('');
    }
  };

  return (
    <ScreenWrapper>
      <SafeHeader title="Identity Verification" onBack={onBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <StepIndicator totalSteps={4} currentStep={4} showLabel />

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.content}
          >
            <AppText variant="h2" style={styles.title}>
              Aadhaar eKYC Verification
            </AppText>
            
            <AppText variant="bodyMd" style={{ color: colors.textSecondary, marginBottom: 24 }}>
              {!referenceId
                ? 'Enter your 12-digit Aadhaar number to verify your identity instantly via UIDAI.'
                : 'Enter the 6-digit verification code sent to your Aadhaar-linked mobile number.'}
            </AppText>

            {!referenceId ? (
              <View>
                <AppInput
                  label="Aadhaar Card Number"
                  value={aadhaarNum}
                  onChangeText={handleAadhaarChange}
                  placeholder="e.g. 5000 1234 5678"
                  keyboardType="numeric"
                  maxLength={12}
                  error={error}
                  leftIcon={<Feather name="credit-card" size={18} color={colors.textSecondary} />}
                />

                <View style={[styles.secureBox, { backgroundColor: colors.backgroundSecondary }]}>
                  <Feather name="lock" size={16} color={colors.success} style={{ marginRight: 8 }} />
                  <AppText variant="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                    Secure partner authentication. We do not store your Aadhaar number.
                  </AppText>
                </View>
              </View>
            ) : (
              <View style={styles.otpSection}>
                <OtpInput
                  length={6}
                  code={otpCode}
                  onChangeCode={setOtpCode}
                />
                
                {error ? <AppText variant="caption" style={styles.errorText}>{error}</AppText> : null}

                <View style={styles.resendContainer}>
                  {resendTimer > 0 ? (
                    <AppText variant="caption" style={{ color: colors.textSecondary }}>
                      Resend OTP in <AppText variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>{resendTimer}s</AppText>
                    </AppText>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp}>
                      <AppText variant="labelMd" style={{ color: colors.primary, fontWeight: '700' }}>
                        Resend OTP code
                      </AppText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </MotiView>
        </ScrollView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          style={[styles.footer, { borderTopColor: colors.border }]}
        >
          {isLoading ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: 48, marginVertical: 8 }}>
              <LottieView
                source={require('../../../assets/loader.json')}
                autoPlay
                loop
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
            </View>
          ) : (
            <AppButton
              title={!referenceId ? 'Send OTP Code' : 'Verify Aadhaar OTP'}
              onPress={!referenceId ? handleSendOtp : () => handleVerifyOtp()}
              disabled={!!(isLoading || (!referenceId && aadhaarNum.length !== 12) || (referenceId && otpCode.length !== 6))}
              variant="primary"
              size="lg"
              style={styles.button}
            />
          )}
        </MotiView>
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
    padding: 20,
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  secureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  otpSection: {
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
  },
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    marginTop: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    width: '100%',
  },
});
