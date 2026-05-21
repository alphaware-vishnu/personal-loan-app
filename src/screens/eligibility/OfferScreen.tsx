import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { AmountSlider } from '../../components/ui/AmountSlider';
import { useColors, useTheme } from '../../theme';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useLoanStore } from '../../store/loanStore';
import { trackEvent } from '../../utils/analytics';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';

interface OfferScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export const OfferScreen: React.FC<OfferScreenProps> = ({ onNext, onBack }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { completeStep } = useOnboardingStore();
  const loanStore = useLoanStore();

  const minAmount = 10000;
  const maxAmount = 150000;
  const interestRate = 14.5; // Annual interest rate percentage

  const [amount, setAmount] = useState(75000);
  const [tenure, setTenure] = useState(12); // months

  const tenures = [3, 6, 9, 12, 18, 24];

  // EMI formula: [P * r * (1 + r)^N] / [((1 + r)^N) - 1]
  const calculateEMI = (p: number, rAnnual: number, n: number) => {
    const r = (rAnnual / 12) / 100;
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  const emi = calculateEMI(amount, interestRate, tenure);
  const processingFee = Math.round(amount * 0.02); // 2% processing fee
  const disbursalAmount = amount - processingFee;

  const handleAccept = () => {
    loanStore.setScheme({
      id: 101,
      loanAmount: amount,
      defaultTenure: tenure,
      defaultInterest: interestRate,
      tenureFrequency: 'MONTHLY',
    });
    loanStore.setCalculationResults(emi, disbursalAmount);

    completeStep('eligibility');
    trackEvent('offer_accepted', { amount, tenure, emi });
    onNext();
  };

  return (
    <ScreenWrapper>
      <SafeHeader title="Personalized Offer" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <StepIndicator totalSteps={4} currentStep={3} showLabel />

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
              onValueChange={setAmount}
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
                    onPress={() => setTenure(t)}
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
          style={styles.button}
        />
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
});
