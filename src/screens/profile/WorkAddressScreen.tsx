import React, { useState, useEffect } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
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
import { getCustomerProfile, updateCustomerProfile, mapLocalToApiOfficeAddress } from '../../services/customerService';
import { useAuthStore } from '../../store/authStore';
import { LoadingState } from '../../components/feedback/LoadingState';

interface WorkAddressScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export const WorkAddressScreen: React.FC<WorkAddressScreenProps> = ({ onNext, onBack }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { formData, updateFormData, completeStep } = useOnboardingStore();

  const [address, setAddress] = useState<Address>({
    flatNo: '',
    area: '',
    city: '',
    stateName: '',
    pinCode: '',
    countryName: 'India',
  });

  const [companyName, setCompanyName] = useState('');
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
          if (data.officeAddress) {
            const localWorkAddress: Address = {
              flatNo: data.officeAddress.building || '',
              area: data.officeAddress.area || '',
              city: data.officeAddress.city || '',
              stateName: data.officeAddress.state || '',
              pinCode: data.officeAddress.pincode || data.officeAddress.postcode || '',
              countryName: data.officeAddress.country || 'India',
            };
            setAddress(localWorkAddress);
            setCompanyName(data.officeAddress.officeName || '');
            updateFormData({
              workAddress: localWorkAddress,
              companyName: data.officeAddress.officeName || '',
            });
          } else if (formData.workAddress) {
            setAddress(formData.workAddress);
            setCompanyName(formData.companyName || '');
          }
        }
      } catch (err) {
        console.error('[Work Address Screen] Failed to load profile:', err);
        if (formData.workAddress) {
          setAddress(formData.workAddress);
          setCompanyName(formData.companyName || '');
        }
      } finally {
        setIsProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  const isComplete =
    (companyName.trim().length || 0) > 1 &&
    (address.flatNo?.trim().length || 0) > 0 &&
    (address.city?.trim().length || 0) > 1 &&
    (address.stateName?.trim().length || 0) > 1 &&
    (address.pinCode?.trim().length || 0) === 6;

  const handleContinue = async () => {
    if (!isComplete) return;
    const customerId = useAuthStore.getState().authData?.customerId || 99999;
    setIsSaving(true);
    try {
      const apiOfficeAddress = mapLocalToApiOfficeAddress(address, companyName);
      await updateCustomerProfile({
        // id: customerId,
        officeAddress: apiOfficeAddress,
      });

      const profile = await getCustomerProfile(customerId);
      if (profile && profile.data) {
        const data = profile.data;
        if (data.officeAddress) {
          const localWorkAddress: Address = {
            flatNo: data.officeAddress.building || '',
            area: data.officeAddress.area || '',
            city: data.officeAddress.city || '',
            stateName: data.officeAddress.state || '',
            pinCode: data.officeAddress.pincode || data.officeAddress.postcode || '',
            countryName: data.officeAddress.country || 'India',
          };
          updateFormData({
            workAddress: localWorkAddress,
            companyName: data.officeAddress.officeName || '',
          });
        } else {
          updateFormData({
            workAddress: address,
            companyName,
          });
        }
      } else {
        updateFormData({
          workAddress: address,
          companyName,
        });
      }
      completeStep('work_address');
      trackEvent('address_submitted', { type: 'work' });
      onNext();
    } catch (err) {
      console.error('[Work Address Screen] Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isProfileLoading) {
    return (
      <ScreenWrapper>
        <SafeHeader title={COPY.address.workTitle} onBack={onBack} />
        <LoadingState message="Loading work address..." fullScreen={false} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <SafeHeader title={COPY.address.workTitle} onBack={onBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <StepIndicator totalSteps={4} currentStep={2} showLabel stageName="Profile Setup" />

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
              isWorkAddress={true}
            />

            <AppButton
              title={COPY.address.cta}
              onPress={handleContinue}
              disabled={!isComplete}
              loading={isSaving}
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