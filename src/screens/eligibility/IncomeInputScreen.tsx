import React, { useState, useEffect } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useColors, useTheme } from '../../theme';
import { COPY } from '../../constants/copy';
import { useOnboardingStore } from '../../store/onboardingStore';
import { trackEvent } from '../../utils/analytics';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { getCustomerProfile, updateCustomerProfile } from '../../services/customerService';
import { useAuthStore } from '../../store/authStore';
import { LoadingState } from '../../components/feedback/LoadingState';
import Toast from 'react-native-toast-message';

interface IncomeInputScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export const IncomeInputScreen: React.FC<IncomeInputScreenProps> = ({ onNext, onBack, onSkip }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { formData, updateFormData, completeStep } = useOnboardingStore();

  const [income, setIncome] = useState(formData.monthlyIncome ? String(formData.monthlyIncome) : '');
  const [error, setError] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const customerId = useAuthStore.getState().authData?.customerId || 99999;
      setIsProfileLoading(true);
      try {
        const profile = await getCustomerProfile(customerId);
        if (profile && profile.data) {
          const data = profile.data;
          if (data.monthlyIncome) {
            setIncome(String(data.monthlyIncome));
            updateFormData({
              monthlyIncome: data.monthlyIncome,
              annualIncome: data.monthlyIncome * 12,
            });
          }
        }
      } catch (err) {
        console.error('[Income Input Screen] Failed to load profile:', err);
      } finally {
        setIsProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  const formatCurrency = (val: string) => {
    const num = parseInt(val.replace(/\D/g, ''), 10);
    if (isNaN(num)) return '';
    return '₹ ' + num.toLocaleString('en-IN');
  };

  const handleTextChange = (text: string) => {
    const numericValue = text.replace(/\D/g, '');
    setIncome(numericValue);
    if (numericValue && parseInt(numericValue, 10) < 10000) {
      setError('Minimum monthly income must be ₹ 10,000');
    } else {
      setError('');
    }
  };

  const isComplete = income.trim().length > 3 && !error && parseInt(income, 10) >= 10000;

  const handleContinue = async () => {
    if (!isComplete) return;
    const numericIncome = parseInt(income, 10);
    const customerId = useAuthStore.getState().authData?.customerId || 99999;
    
    setIsSaving(true);
    try {
      await updateCustomerProfile({
        monthlyIncome: numericIncome,
      });

      const profile = await getCustomerProfile(customerId);
      if (profile && profile.data) {
        const data = profile.data;
        updateFormData({
          monthlyIncome: data.monthlyIncome || numericIncome,
          annualIncome: (data.monthlyIncome || numericIncome) * 12,
        });
      } else {
        updateFormData({
          monthlyIncome: numericIncome,
          annualIncome: numericIncome * 12,
        });
      }
      
      completeStep('income');
      trackEvent('income_submitted', { monthlyIncome: numericIncome });
      onNext();
    } catch (err: any) {
      console.error('[Income Input Screen] Failed to save profile:', err);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: err.message || 'Failed to save income details.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isSalaried = formData.employmentType === 'salaried';

  if (isProfileLoading) {
    return (
      <ScreenWrapper>
        <SafeHeader title="Income Details" onBack={onBack} />
        <LoadingState message="Loading income details..." fullScreen={false} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <SafeHeader title="Income Details" onBack={onBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <StepIndicator totalSteps={3} currentStep={0} showLabel stageName="Eligibility Check" />

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.content}
          >
            <AppText variant="h2" style={styles.title}>
              {isSalaried ? "What is your net monthly salary?" : "What is your average monthly income?"}
            </AppText>
            
            <AppText variant="bodyMd" style={{ color: colors.textSecondary, marginBottom: 24 }}>
              {isSalaried 
                ? "Please enter the amount credited to your bank account after all deductions." 
                : "Please enter your average monthly business earnings."}
            </AppText>

            {isSalaried && formData.companyName && (
              <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
                <AppText variant="labelSm" style={{ color: colors.textSecondary }}>Company Name</AppText>
                <AppText variant="bodyLg" style={{ color: colors.text, fontWeight: '600' }}>
                  {formData.companyName}
                </AppText>
              </View>
            )}

            <AppInput
              label={isSalaried ? "Monthly Credited Salary" : "Monthly Income"}
              value={formatCurrency(income)}
              onChangeText={handleTextChange}
              placeholder="e.g. ₹ 45,000"
              keyboardType="numeric"
              maxLength={12}
              error={error}
            />

            <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 12 }}>
              Note: This information will be verified against your bank statements.
            </AppText>
          </MotiView>
        </ScrollView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 200 }}
          style={[styles.footer, { borderTopColor: colors.border }]}
        >
          <AppButton
            title="Check Offer Eligibility"
            onPress={handleContinue}
            disabled={!isComplete}
            variant="primary"
            size="lg"
            style={styles.button}
          />
          {onSkip && (
            <AppButton
              title="Skip, I'll do later"
              variant="ghost"
              size="md"
              onPress={onSkip}
              style={{ marginTop: 8 }}
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
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    width: '100%',
  },
});
