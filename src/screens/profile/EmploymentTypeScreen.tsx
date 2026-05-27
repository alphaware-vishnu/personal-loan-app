import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { EmploymentTypePicker } from '../../components/ui/EmploymentTypePicker';
import { useColors, useTheme } from '../../theme';
import { COPY } from '../../constants/copy';
import { useOnboardingStore } from '../../store/onboardingStore';
import { trackEvent } from '../../utils/analytics';
import type { EmploymentType } from '../../constants/onboardingSteps';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { getCustomerProfile, updateCustomerProfile, mapApiToLocalEmploymentType, mapLocalToApiEmploymentType } from '../../services/customerService';
import { useAuthStore } from '../../store/authStore';
import { LoadingState } from '../../components/feedback/LoadingState';

interface EmploymentTypeScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export const EmploymentTypeScreen: React.FC<EmploymentTypeScreenProps> = ({ onNext, onBack }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { formData, updateFormData, completeStep } = useOnboardingStore();
  const [selected, setSelected] = useState<EmploymentType | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const customerId = useAuthStore.getState().authData?.customerId || 99999;
      setIsProfileLoading(true);
      try {
        const profile = await getCustomerProfile(customerId);
        if (profile && profile.data) {
          const mappedType = mapApiToLocalEmploymentType(profile.data.employmentType);
          if (mappedType) {
            setSelected(mappedType);
            updateFormData({ employmentType: mappedType });
          } else if (formData.employmentType) {
            setSelected(formData.employmentType);
          }
        }
      } catch (err) {
        console.error('[Employment Screen] Failed to load profile:', err);
        if (formData.employmentType) {
          setSelected(formData.employmentType);
        }
      } finally {
        setIsProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSelect = (type: EmploymentType) => {
    setSelected(type);
    trackEvent('employment_selected', { type });
  };

  const handleContinue = async () => {
    if (!selected) return;
    const customerId = useAuthStore.getState().authData?.customerId || 99999;
    setIsSaving(true);
    try {
      // Map local to api
      const apiType = mapLocalToApiEmploymentType(selected);
      await updateCustomerProfile({
        // id: customerId,
        employmentType: apiType,
      });

      const profile = await getCustomerProfile(customerId);
      if (profile && profile.data) {
        const mappedType = mapApiToLocalEmploymentType(profile.data.employmentType);
        updateFormData({ employmentType: mappedType || selected });
      } else {
        updateFormData({ employmentType: selected });
      }
      completeStep('employment');
      onNext();
    } catch (err) {
      console.error('[Employment Screen] Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isProfileLoading) {
    return (
      <ScreenWrapper>
        <SafeHeader title="Work Details" onBack={onBack} />
        <LoadingState message="Loading work details..." fullScreen={false} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <SafeHeader title="Work Details" onBack={onBack} />

      <View style={styles.content}>
        <StepIndicator totalSteps={4} currentStep={1} showLabel stageName="Profile Setup" />

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.formContainer}
        >
          <AppText variant="h2" style={[styles.title, { color: colors.text }]}>
            {COPY.employment.title}
          </AppText>
          <AppText variant="bodyMd" style={[styles.subtitle, { color: colors.textSecondary }]}>
            {COPY.employment.subtitle}
          </AppText>

          <EmploymentTypePicker selected={selected} onSelect={handleSelect} />

          <AppButton
            title={COPY.employment.cta}
            onPress={handleContinue}
            disabled={!selected}
            loading={isSaving}
            style={styles.button}
          />
        </MotiView>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  formContainer: {
    flex: 1,
    marginTop: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 24,
  },
  button: {
    marginTop: 'auto',
    marginBottom: 24,
  },
});