import React, { useState, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { getCustomerProfile, updateCustomerProfile, mapApiToLocalAddress, mapLocalToApiHomeAddress } from '../../services/customerService';
import { useAuthStore } from '../../store/authStore';
import { LoadingState } from '../../components/feedback/LoadingState';

interface PersonalAddressScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export const PersonalAddressScreen: React.FC<PersonalAddressScreenProps> = ({ onNext, onBack, onSkip }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { formData, updateFormData, completeStep, setProfileCompleted } = useOnboardingStore();

  const [sameAsWork, setSameAsWork] = useState(formData.sameAsWorkAddress || false);

  const [address, setAddress] = useState<Address>({
    flatNo: '',
    area: '',
    city: '',
    stateName: '',
    pinCode: '',
    countryName: 'India',
  });

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const customerId = useAuthStore.getState().authData?.customerId || 99999;
      setIsProfileLoading(true);
      try {
        const profile = await getCustomerProfile(customerId);
        if (profile && profile.success && profile.data) {
          const data = profile.data;
          if (data.homeAddress) {
            const localHomeAddress = mapApiToLocalAddress(data.homeAddress);
            setAddress(localHomeAddress);
            updateFormData({ personalAddress: localHomeAddress });
          } else if (formData.personalAddress) {
            setAddress(formData.personalAddress);
          }
        }
      } catch (err) {
        console.error('[Personal Address Screen] Failed to load profile:', err);
        if (formData.personalAddress) {
          setAddress(formData.personalAddress);
        }
      } finally {
        setIsProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSameAsWork = () => {
    const newValue = !sameAsWork;
    setSameAsWork(newValue);

    if (newValue && formData.workAddress) {
      setAddress({
        ...formData.workAddress,
        flatNo: address.flatNo || '', // User still needs to enter flat number for home
      });
    }
  };

  const isComplete =
    (address.flatNo?.trim().length || 0) > 0 &&
    (address.city?.trim().length || 0) > 1 &&
    (address.pinCode?.trim().length || 0) === 6 &&
    (address.stateName?.trim().length || 0) > 1;

  const handleContinue = async () => {
    if (!isComplete) return;
    const customerId = useAuthStore.getState().authData?.customerId || 99999;
    setIsSaving(true);
    try {
      const apiHomeAddress = mapLocalToApiHomeAddress(address);
      await updateCustomerProfile({
        // id: customerId,
        homeAddress: apiHomeAddress,
      });

      updateFormData({
        personalAddress: address,
        sameAsWorkAddress: sameAsWork,
      });
      completeStep('personal_address');
      setProfileCompleted(true);
      trackEvent('address_submitted', { type: 'personal' });
      onNext();
    } catch (err) {
      console.error('[Personal Address Screen] Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isProfileLoading) {
    return (
      <ScreenWrapper>
        <SafeHeader title="Personal Address" onBack={onBack} />
        <LoadingState message="Loading personal address..." fullScreen={false} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <SafeHeader title="Personal Address" onBack={onBack} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <StepIndicator totalSteps={4} currentStep={3} showLabel stageName="Profile Setup" />

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.content}
          >
            <AppText variant="h2" style={styles.title}>
              {COPY.address.personalTitle}
            </AppText>
            <AppText variant="bodyMd" style={[styles.subtitle, { color: colors.textSecondary }]}>
              {COPY.address.personalSubtitle}
            </AppText>

            {formData.workAddress && (
              <TouchableOpacity
                style={[styles.checkboxContainer, { borderColor: colors.borderLight }]}
                onPress={handleSameAsWork}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={sameAsWork ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={sameAsWork ? colors.primary : colors.textSecondary}
                />
                <AppText variant="bodyMd" style={[styles.checkboxLabel, { color: colors.text }]}>
                  {COPY.address.sameAsWork}
                </AppText>
              </TouchableOpacity>
            )}

            <AddressAutoFill
              value={address}
              onChange={setAddress}
              error={undefined}
            />

            <AppButton
              title={COPY.address.cta}
              onPress={handleContinue}
              disabled={!isComplete}
              loading={isSaving}
              style={styles.button}
            />

            {onSkip && (
              <AppButton
                title="Skip, I'll do later"
                variant="ghost"
                size="md"
                onPress={onSkip}
                style={styles.skipButton}
              />
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
  },
  subtitle: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 12,
    fontWeight: '500',
  },
  button: {
    marginTop: 24,
    marginBottom: 24,
  },
  skipButton: {
    marginBottom: 24,
  },
});
