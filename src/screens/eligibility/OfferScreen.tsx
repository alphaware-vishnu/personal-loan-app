import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import { Feather, Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { AmountSlider } from '../../components/ui/AmountSlider';
import { useColors, useTheme } from '../../theme';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useLoanStore } from '../../store/loanStore';
import { useOfferStore } from '../../store/offerStore';
import { useAuthStore } from '../../store/authStore';
import { createApplication } from '../../services/applicationService';
import { trackEvent } from '../../utils/analytics';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';

interface OfferScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export const OfferScreen: React.FC<OfferScreenProps> = ({ onNext, onBack, onSkip }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { completeStep } = useOnboardingStore();
  const loanStore = useLoanStore();
  const { 
    eligibilityResult, 
    selectedAmount, 
    selectedTenure, 
    setSelectedAmount, 
    setSelectedTenure 
  } = useOfferStore();

  const minAmount = eligibilityResult?.minAmount ?? 10000;
  const maxAmount = eligibilityResult?.maxAmount ?? 150000;
  const interestRate = eligibilityResult?.interestRate ?? 14.5;
  const maxTenure = eligibilityResult?.maxTenure ?? 12;

  const [amount, setAmount] = useState(() => {
    return selectedAmount > 0 ? selectedAmount : 75000;
  });
  const [tenure, setTenure] = useState(() => {
    return selectedTenure > 0 ? selectedTenure : 12;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync component state with eligibility result when loaded
  useEffect(() => {
    if (eligibilityResult) {
      const initialAmount = selectedAmount > 0 ? selectedAmount : Math.min(Math.max(75000, minAmount), maxAmount);
      const initialTenure = selectedTenure > 0 ? selectedTenure : maxTenure;

      setAmount(initialAmount);
      setTenure(initialTenure);

      // Save initial selections to the store
      if (selectedAmount === 0) setSelectedAmount(initialAmount);
      if (selectedTenure === 0) setSelectedTenure(initialTenure);
    }
  }, [eligibilityResult]);

  // Filter tenures up to approved maxTenure and ensure maxTenure is included
  const allTenures = [3, 6, 9, 12, 18, 24];
  const tenures = allTenures.filter((t) => t <= maxTenure);
  if (!tenures.includes(maxTenure) && maxTenure > 0) {
    tenures.push(maxTenure);
  }
  tenures.sort((a, b) => a - b);

  // EMI formula: [P * r * (1 + r)^N] / [((1 + r)^N) - 1]
  const calculateEMI = (p: number, rAnnual: number, n: number) => {
    const r = (rAnnual / 12) / 100;
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  const emi = calculateEMI(amount, interestRate, tenure);
  const processingFee = Math.round(amount * 0.02); // 2% processing fee
  const disbursalAmount = amount - processingFee;

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const customerId = useAuthStore.getState().authData?.customerId || loanStore.customerId;
      const schemeMasterId = loanStore.schemeMasterId || 101;

      if (!customerId) {
        throw new Error('Customer ID not found. Please log in again.');
      }

      // Create loan application on the backend
      const response = await createApplication({
        customerId: Number(customerId),
        schemeMasterId: Number(schemeMasterId),
        requestedAmount: amount,
        requestedTenure: tenure,
      });

      const appData = response.data?.data || response.data;
      const appId = appData?.id || appData?.applicationId;
      const prodId = appData?.productId || 1;

      if (!appId) {
        throw new Error('Failed to retrieve application ID from server.');
      }

      // Update state in loanStore
      loanStore.setScheme({
        id: schemeMasterId,
        loanAmount: amount,
        defaultTenure: tenure,
        defaultInterest: interestRate,
        tenureFrequency: 'MONTHLY',
      });
      loanStore.setCalculationResults(emi, disbursalAmount);
      loanStore.setApplicationData(appId, prodId);

      completeStep('eligibility');
      trackEvent('offer_accepted', { amount, tenure, emi, applicationId: appId });
      onNext();
    } catch (err: any) {
      console.error('Failed to accept offer / create application:', err);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: err.response?.data?.message || err.message || 'Unable to register application. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!eligibilityResult) {
    return (
      <ScreenWrapper>
        <SafeHeader title="Personalized Offer" onBack={onBack} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="bodyMd" style={{ marginTop: 16, color: colors.textSecondary }}>
            Loading your customized offer...
          </AppText>
        </View>
      </ScreenWrapper>
    );
  }

  if (eligibilityResult.status === 'NOT_ELIGIBLE') {
    return (
      <ScreenWrapper>
        <SafeHeader title="Eligibility Status" onBack={onBack} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.rejectionCard}
          >
            <View style={[styles.rejectionIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="close-circle" size={48} color="#EF4444" />
            </View>
            <AppText variant="h2" style={[styles.title, { marginTop: 16 }]} align="center">
              Eligibility Status
            </AppText>
            <AppText variant="bodyMd" style={{ color: colors.textSecondary, marginTop: 12, lineHeight: 22 }} align="center">
              {eligibilityResult.message || "Thank you for applying. Unfortunately, your credit profile doesn't meet our criteria for a loan approval at this time."}
            </AppText>
            
            <View style={[styles.rejectionDetails, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <AppText variant="caption" style={{ color: colors.textSecondary }} align="center">
                You can re-apply after 90 days. Feel free to explore other services or contact customer support for further details.
              </AppText>
            </View>

            <AppButton
              title="Back to Dashboard"
              onPress={() => onSkip?.() || onBack()}
              variant="outline"
              size="lg"
              style={{ width: '100%', marginTop: 24 }}
            />
          </MotiView>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <SafeHeader title="Personalized Offer" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <StepIndicator totalSteps={1} currentStep={0} showLabel stageName="Personalized Offer" />

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.content}
        >
          <AppText variant="h2" style={styles.title}>
            Congratulations! 🎉
          </AppText>
          <AppText variant="bodyMd" style={{ color: colors.textSecondary, marginBottom: 20 }}>
            Here is your approved credit limit. Customize your loan amount and tenure below.
          </AppText>

          {/* Offer Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <AppText variant="caption" style={{ color: colors.primaryDark, textTransform: 'uppercase', letterSpacing: 1 }}>
              Approved Credit Limit
            </AppText>
            <AppText variant="display" style={{ color: colors.primary, fontWeight: '800', marginTop: 4 }}>
              ₹ {maxAmount.toLocaleString('en-IN')}
            </AppText>
            <View style={styles.interestBadge}>
              <Feather name="percent" size={12} color={colors.secondaryDark} style={{ marginRight: 4 }} />
              <AppText variant="labelSm" style={{ color: colors.secondaryDark, fontWeight: '600' }}>
                Interest Rate: {interestRate}% p.a.
              </AppText>
            </View>
          </View>

          {/* Slider */}
          <View style={styles.section}>
            <AppText variant="labelLg" style={styles.sectionLabel}>
              Select Loan Amount
            </AppText>
            <AmountSlider
              value={amount}
              onValueChange={(val) => {
                setAmount(val);
                setSelectedAmount(val);
              }}
              min={minAmount}
              max={maxAmount}
              step={5000}
            />
          </View>

          {/* Tenure Selection */}
          <View style={styles.section}>
            <AppText variant="labelLg" style={styles.sectionLabel}>
              Select Tenure (Months)
            </AppText>
            <View style={styles.tenureContainer}>
              {tenures.map((t) => {
                const isSelected = tenure === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => {
                      setTenure(t);
                      setSelectedTenure(t);
                    }}
                    style={[
                      styles.tenureCard,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                      },
                    ]}
                  >
                    <AppText
                      variant="labelLg"
                      style={{
                        color: isSelected ? colors.primary : colors.text,
                        fontWeight: '700',
                      }}
                    >
                      {t}
                    </AppText>
                    <AppText
                      variant="caption"
                      style={{
                        color: isSelected ? colors.primaryDark : colors.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      Months
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Loan Calculations List */}
          <View style={[styles.detailsCard, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.detailRow}>
              <AppText variant="bodyMd" style={{ color: colors.textSecondary }}>Monthly EMI</AppText>
              <AppText variant="bodyLg" style={{ color: colors.text, fontWeight: '700' }}>
                ₹ {emi.toLocaleString('en-IN')} / mo
              </AppText>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <AppText variant="bodyMd" style={{ color: colors.textSecondary }}>Processing Fee (2%)</AppText>
              <AppText variant="bodyLg" style={{ color: colors.text }}>
                ₹ {processingFee.toLocaleString('en-IN')}
              </AppText>
            </View>

            <View style={styles.detailRow}>
              <AppText variant="bodyMd" style={{ color: colors.textSecondary }}>Disbursal Amount</AppText>
              <AppText variant="bodyLg" style={{ color: colors.text, fontWeight: '600' }}>
                ₹ {disbursalAmount.toLocaleString('en-IN')}
              </AppText>
            </View>
          </View>
        </MotiView>
      </ScrollView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 200 }}
        style={[styles.footer, { borderTopColor: colors.border }]}
      >
        <AppButton
          title="Accept Offer & Proceed to KYC"
          onPress={handleAccept}
          variant="primary"
          size="lg"
          loading={isSubmitting}
          style={styles.button}
        />
        {!isSubmitting && onSkip && (
          <AppButton
            title="Skip, I'll do later"
            variant="ghost"
            size="md"
            onPress={onSkip}
            style={{ marginTop: 8 }}
          />
        )}
      </MotiView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
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
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 28,
  },
  interestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#DEF7EC',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: 12,
  },
  tenureContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tenureCard: {
    flex: 1,
    minWidth: '28%',
    maxWidth: '30%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    width: '100%',
  },
  rejectionCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  rejectionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rejectionDetails: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginTop: 24,
  },
});
