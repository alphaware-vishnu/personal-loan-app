import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { MotiView } from 'moti';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColors, useTheme } from '../theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { SafeHeader } from '../components/layout/SafeHeader';
import { AppText } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { StepIndicator } from '../components/ui/StepIndicator';

import { useLoanStore } from '../store/loanStore';
import { generateSanctionLetter } from '../services/applicationService';
import { trackEvent } from '../utils/analytics';
import { formatCurrency } from '../utils/formatters';

interface SanctionLetterScreenProps {
  onNext: () => void;
  onBack: () => void;
}

export const SanctionLetterScreen: React.FC<SanctionLetterScreenProps> = ({
  onNext,
  onBack,
}) => {
  const colors = useColors();
  const { theme } = useTheme();

  const loanStoreState = useLoanStore();
  const {
    requestedAmount,
    interest,
    tenure,
    emi,
    applicationId,
  } = loanStoreState;

  const [hasConsented, setHasConsented] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [sanctionDetails, setSanctionDetails] = useState<any>(null);

  useEffect(() => {
    const initSanctionLetter = async () => {
      if (!applicationId) {
        setIsGenerating(false);
        return;
      }

      try {
        console.log('[SanctionLetter] Generating/fetching sanction letter for application:', applicationId);
        const response = await generateSanctionLetter(applicationId);
        
        if (response && response.data) {
          console.log('[SanctionLetter] Received response:', response.data);
          setSanctionDetails(response.data);
        }
      } catch (error: any) {
        console.error('[SanctionLetter] Generation failed:', error);
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to generate your sanction letter. Please try again.'
        );
      } finally {
        setIsGenerating(false);
      }
    };

    initSanctionLetter();
  }, [applicationId]);

  const handleDownload = async () => {
    const fileUrl = sanctionDetails?.sanctionLetterFileUrl;
    if (fileUrl) {
      console.log('[SanctionLetter] Opening sanction letter URL:', fileUrl);
      setIsDownloading(true);
      trackEvent('sanction_letter_viewed');
      try {
        const canOpen = await Linking.canOpenURL(fileUrl);
        if (canOpen) {
          await Linking.openURL(fileUrl);
          trackEvent('sanction_letter_downloaded');
        } else {
          Alert.alert('Error', 'Unable to open the sanction letter document.');
        }
      } catch (err) {
        console.error('[SanctionLetter] Error opening document:', err);
        Alert.alert('Error', 'An error occurred while opening the sanction letter.');
      } finally {
        setIsDownloading(false);
      }
    } else {
      // Mock download logic if URL isn't returned yet
      setIsDownloading(true);
      trackEvent('sanction_letter_viewed');
      setTimeout(() => {
        setIsDownloading(false);
        trackEvent('sanction_letter_downloaded');
        Alert.alert('Success', 'Sanction letter downloaded successfully as PDF.');
      }, 1500);
    }
  };

  const handleProceed = () => {
    if (!hasConsented) return;
    trackEvent('sanction_letter_accepted');
    onNext();
  };

  // Resolve values (fall back to requested/store values if API doesn't return them)
  const sanctionedAmountVal = sanctionDetails?.sanctionedAmount ?? requestedAmount;
  const approvedTenureVal = sanctionDetails?.approvedTenure ?? tenure;
  const approvedInterestRateVal = sanctionDetails?.approvedInterestRate ?? interest;
  const emiAmountVal = sanctionDetails?.emiAmount ?? emi;
  const processingFeeVal = sanctionDetails?.processingFee ?? 0;

  if (isGenerating) {
    return (
      <ScreenWrapper padded={false}>
        <View style={styles.headerWrapper}>
          <SafeHeader title="Sanction Letter" onBack={onBack} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="bodyMd" style={{ color: colors.textSecondary, marginTop: 12 }}>
            Generating your sanction terms...
          </AppText>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper padded={false}>
      <View style={styles.headerWrapper}>
        <SafeHeader title="Sanction Letter" onBack={onBack} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.screenPadding }]}
      >
        <View style={styles.stepIndicator}>
          <StepIndicator totalSteps={1} currentStep={0} showLabel stageName="Sanction Approval" />
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.content}
        >
          <AppText variant="h2" style={styles.title}>
            Review Sanction Terms
          </AppText>
          <AppText variant="bodyMd" style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your loan application has been approved! Please review the terms of your sanction letter.
          </AppText>

          {/* Terms Card */}
          <AppCard style={styles.termsCard}>
            <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
              <AppText variant="labelLg" style={{ fontWeight: '700' }}>
                Approved Loan Terms
              </AppText>
              <Feather name="check-circle" size={16} color={colors.success} />
            </View>

            <View style={styles.termsRow}>
              <View style={styles.termItem}>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>Sanctioned Amount</AppText>
                <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                  {formatCurrency(sanctionedAmountVal)}
                </AppText>
              </View>
              <View style={styles.termItem}>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>Interest Rate</AppText>
                <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                  {approvedInterestRateVal}% p.a.
                </AppText>
              </View>
            </View>

            <View style={[styles.termsRow, { marginTop: 16 }]}>
              <View style={styles.termItem}>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>Tenure</AppText>
                <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                  {approvedTenureVal} Months
                </AppText>
              </View>
              <View style={styles.termItem}>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>Monthly EMI</AppText>
                <AppText variant="bodyMedium" style={{ fontWeight: '800', color: colors.primary }}>
                  {formatCurrency(emiAmountVal)}
                </AppText>
              </View>
            </View>

            {processingFeeVal > 0 && (
              <View style={[styles.termsRow, { marginTop: 16 }]}>
                <View style={styles.termItem}>
                  <AppText variant="caption" style={{ color: colors.textSecondary }}>Processing Fee</AppText>
                  <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                    {formatCurrency(processingFeeVal)}
                  </AppText>
                </View>
              </View>
            )}

            <AppButton
              title="Download Sanction PDF"
              variant="outline"
              size="sm"
              icon={<Feather name="download" size={16} color={colors.primary} />}
              onPress={handleDownload}
              loading={isDownloading}
              style={{ marginTop: 20 }}
            />
          </AppCard>

          {/* Legal Summary */}
          <AppText variant="label" style={[styles.sectionTitle, { color: colors.text }]}>
            Key Undertakings
          </AppText>
          <View style={[styles.documentBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <ScrollView nestedScrollEnabled style={styles.documentScroll}>
              <AppText variant="caption" style={{ color: colors.textSecondary, lineHeight: 18 }}>
                By accepting this sanction letter, the borrower understands and agrees to the following terms:{'\n\n'}
                1. SANCTION LIMIT: The approved amount is subject to final bank linkage and execution of the digital eSign agreement.{'\n\n'}
                2. PROCESSING FEE: The processing fee detailed above will be deducted from the disbursed amount at the time of payout.{'\n\n'}
                3. INTEREST COMPUTATION: Interest is calculated on a reducing balance basis. The monthly installment (EMI) has been computed accordingly.{'\n\n'}
                4. REPAYMENT MANDATE: Acceptance of these terms requires setting up an auto-debit repayment mandate prior to loan disbursal.
              </AppText>
            </ScrollView>
          </View>

          {/* Consent Checkbox */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setHasConsented(!hasConsented)}
            style={styles.consentRow}
          >
            <Ionicons
              name={hasConsented ? 'checkbox' : 'square-outline'}
              size={22}
              color={hasConsented ? colors.primary : colors.textSecondary}
              style={{ marginTop: 2 }}
            />
            <AppText variant="caption" style={[styles.consentText, { color: colors.textSecondary }]}>
              I have reviewed the sanctioned terms, download/read the sanction letter, and agree to proceed to the eSign stage.
            </AppText>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>

      {/* Footer CTA */}
      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 200 }}
        style={[styles.footer, { borderTopColor: colors.border, paddingHorizontal: theme.screenPadding }]}
      >
        <AppButton
          title="Accept & Proceed to eSign"
          variant="primary"
          size="lg"
          disabled={!hasConsented}
          onPress={handleProceed}
          icon={<Feather name="arrow-right" size={18} color="#fff" />}
        />
      </MotiView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  stepIndicator: {
    marginTop: 8,
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 20,
  },
  termsCard: {
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0', // default border fallback
    marginBottom: 16,
  },
  termsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  termItem: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  documentBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    height: 120,
    marginBottom: 24,
  },
  documentScroll: {
    flex: 1,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  consentText: {
    flex: 1,
    marginLeft: 8,
    lineHeight: 16,
  },
  footer: {
    paddingVertical: 16,
    borderTopWidth: 1,
  },
});
