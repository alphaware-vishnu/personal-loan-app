/**
 * WorkAddressScreen — GPS auto-fill for company/work address
 */

import React, { useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { AddressAutoFill } from '../../components/ui/AddressAutoFill';
import { useColors, useTheme } from '../../theme';
import { COPY } from '../../constants/copy';
import { useOnboardingStore } from '../../store/onboardingStore';
import { trackEvent } from '../../utils/analytics';
import type { Address } from '../../types/customer.type';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';

interface WorkAddressScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export const WorkAddressScreen: React.FC<WorkAddressScreenProps> = ({ onNext, onBack }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { formData, updateFormData, completeStep } = useOnboardingStore();

  const [address, setAddress] = useState<Address>(
    formData.workAddress || {
      flatNo: '',
      area: '',
      city: '',
      stateName: '',
      pinCode: '',
      countryName: 'India',
    }
  );

  const [companyName, setCompanyName] = useState(formData.companyName || '');

  const isComplete =
    (companyName.trim().length || 0) > 1 &&
    (address.flatNo?.trim().length || 0) > 0 &&
    (address.city?.trim().length || 0) > 1 &&
    (address.stateName?.trim().length || 0) > 1 &&
    (address.pinCode?.trim().length || 0) === 6;

  const handleContinue = () => {
    if (!isComplete) return;
    
    updateFormData({
      workAddress: address,
      companyName,
    });
    completeStep('work_address');
    trackEvent('address_submitted', { type: 'work' });
    onNext();
  };

  return (
    <ScreenWrapper>
      <SafeHeader title={COPY.address.workTitle} onBack={onBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <StepIndicator totalSteps={4} currentStep={2} showLabel />

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.content}
          >
            <AppText variant="h2" style={styles.title}>
              {COPY.address.workTitle}
            </AppText>
            <AppText variant="bodyMd" style={[styles.subtitle, { color: colors.textSecondary }]}>
              {COPY.address.workSubtitle}
            </AppText>

            <AppInput
              label="Company Name"
              placeholder="e.g. Acme Corporation"
              value={companyName}
              onChangeText={setCompanyName}
            />

            <AddressAutoFill
              value={address}
              onChange={setAddress}
              error={undefined}
            />

            <AppButton
              title={COPY.address.cta}
              onPress={handleContinue}
              disabled={!isComplete}
              style={styles.button}
            />
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
  },
  subtitle: {
    marginBottom: 16,
  },
  button: {
    marginTop: 24,
    marginBottom: 24,
  },
});