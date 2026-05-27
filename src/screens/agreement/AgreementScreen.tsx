import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MotiView } from 'moti';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors, useTheme } from '../../theme';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { StepIndicator } from '../../components/ui/StepIndicator';

import { useLoanStore } from '../../store/loanStore';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { createCustomer } from '../../services/customerService';
import { updateApplication, updateStepStatus } from '../../services/applicationService';
import { trackEvent } from '../../utils/analytics';
import { formatCurrency } from '../../utils/formatters';
import {
  createDigioInstance,
  initiateESign,
  refreshESignStatus,
  startEsignFlow,
  type DigioResult,
} from '../../services/digioService';

interface AgreementScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export const AgreementScreen: React.FC<AgreementScreenProps> = ({ onNext, onBack, onSkip }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { completeStep } = useOnboardingStore();

  const loanStoreState = useLoanStore();
  const {
    requestedAmount,
    interest,
    tenure,
    emi,
    customerInfo,
    setCustomerId,
    applicationId,
    isExistingCustomer,
  } = loanStoreState;

  const { mobile: verifiedMobile, authData, setCustomerId: setAuthCustomerId } = useAuthStore();

  const [hasConsented, setHasConsented] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [esignStatus, setEsignStatus] = useState<'idle' | 'creating' | 'signing' | 'success' | 'failed'>('idle');

  // Digio SDK instance ref — created once and reused
  const digioRef = useRef(createDigioInstance());

  // Listen to gateway events for progress tracking
  useEffect(() => {
    const listener = digioRef.current.addGatewayEventListener((event: any) => {
      if (__DEV__) {
        console.log('[AgreementScreen] Digio Gateway Event:', event);
      }
      trackEvent('digio_gateway_event', { event: JSON.stringify(event) });
    });

    return () => {
      listener.remove();
    };
  }, []);

  const handleDownload = () => {
    setIsDownloading(true);
    trackEvent('agreement_viewed');
    setTimeout(() => {
      setIsDownloading(false);
      trackEvent('agreement_downloaded');
      Alert.alert('Success', 'Sanction letter downloaded successfully as PDF.');
    }, 1500);
  };

  const handleEsign = async () => {
    if (!hasConsented) return;

    setIsSubmitting(true);
    setEsignStatus('creating');
    trackEvent('esign_initiated');

    try {
      let finalCustomerId = authData?.customerId || loanStoreState.customerId;

      // 1. Create Customer (PATCH /customer) ONLY for NEW customers
      if (!isExistingCustomer) {
        const customerPayload = {
          id: finalCustomerId || undefined,
          applicantName: customerInfo.applicantName,
          mobileNumber: verifiedMobile || customerInfo.mobileNumber,
          panNumber: customerInfo.panNumber,
          gender: 'MALE',
          leadSource: 'HEYLON',
          leadStatus: 'ACTIVE',
          applicationSource: 'ALFIN',
          clientType: 'INDIVIDUAL',
          customerBanks: customerInfo.customerBanks.map((bank) => ({
            ...bank,
            accountType: 'SAVINGS',
            isDefault: true,
          })),
          address: {
            city: 'Mumbai',
            pinCode: '400001',
            stateName: 'Maharashtra',
            countryName: 'India',
          },
        };

        const customerResponse = await createCustomer(customerPayload);
        const newCustomerId = customerResponse.data?.data?.id || customerResponse.data?.id;
        if (newCustomerId) {
          finalCustomerId = newCustomerId;
        }
      }

      if (!finalCustomerId) {
        throw new Error('Failed to retrieve Customer ID for application link');
      }

      setCustomerId(Number(finalCustomerId));
      setAuthCustomerId(Number(finalCustomerId));

      // 2. Update Application with final details
      const applicationPayload = {
        id: applicationId,
        requestedAmount: loanStoreState.requestedAmount,
        disbursalAmount: loanStoreState.disbursalAmount,
        emi: loanStoreState.emi,
        tenure: loanStoreState.tenure,
        interest: loanStoreState.interest,
        schemeMasterId: loanStoreState.schemeMasterId,
        repaymentFrequency: loanStoreState.repaymentFrequency,
        customerId: finalCustomerId,
        applicationSource: 'ALFIN',
        applicationDocuments: loanStoreState.applicationDocuments.map((doc) => ({
          categoryId: doc.categoryId,
          documentTypeId: doc.documentTypeId,
          awsDocumentIds: doc.awsDocumentIds,
          documentNumber: doc.documentNumber,
        })),
      };

      await updateApplication(applicationPayload);

      // 3. Create eSign request via backend → get docId
      const esignData = await initiateESign(applicationId!);
      const identifier = customerInfo.email || verifiedMobile || customerInfo.mobileNumber || '';

      // 4. Launch Digio SDK gateway
      setEsignStatus('signing');

      const result: DigioResult = await startEsignFlow(
        digioRef.current,
        esignData.docId,
        identifier,
      );

      if (result.success) {
        setEsignStatus('success');

        // 5. Mark agreement as completed and sync status
        if (applicationId) {
          try {
            await refreshESignStatus(applicationId);
          } catch (e) {
            console.warn('Failed to refresh esign status:', e);
          }
          await updateStepStatus(applicationId, { loanAgreementCompleted: true });
        }

        completeStep('agreement');
        trackEvent('esign_completed', { documentId: result.documentId });

        // Brief delay to show success state before navigating
        setTimeout(() => onNext(), 800);
      } else {
        setEsignStatus('failed');
        trackEvent('esign_failed', { message: result.message });
        Alert.alert(
          'eSign Incomplete',
          result.message || 'The eSign process was not completed. Please try again.',
        );
      }
    } catch (error: any) {
      setEsignStatus('failed');
      console.error('eSign flow failed:', error);
      trackEvent('api_error', { error: error.message });
      Alert.alert(
        'eSign Failed',
        error.response?.data?.message || error.message || 'There was an error initiating eSign. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Get status-specific button configuration */
  const getButtonConfig = () => {
    switch (esignStatus) {
      case 'creating':
        return { title: 'Preparing eSign Request...', disabled: true };
      case 'signing':
        return { title: 'eSign in Progress...', disabled: true };
      case 'success':
        return { title: '✓ Agreement Signed Successfully', disabled: true };
      case 'failed':
        return { title: 'Retry eSign & eStamp', disabled: false };
      default:
        return { title: 'Proceed to eSign & eStamp', disabled: false };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <ScreenWrapper padded={false}>
      <View style={styles.headerWrapper}>
        <SafeHeader title="Sanction Agreement" onBack={onBack} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: theme.screenPadding }]}
      >
        <View style={styles.stepIndicator}>
          <StepIndicator totalSteps={1} currentStep={0} showLabel stageName="Loan Agreement" />
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.content}
        >
          <AppText variant="h2" style={styles.title}>
            Review & Sign Agreement
          </AppText>
          <AppText variant="bodyMd" style={[styles.subtitle, { color: colors.textSecondary }]}>
            Please review the loan terms and digitally sign using Aadhaar eSign.
          </AppText>

          {/* Terms Overview Card */}
          <AppCard style={styles.termsCard}>
            <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
              <AppText variant="labelLg" style={{ fontWeight: '700' }}>
                Key Loan Details
              </AppText>
              <Feather name="shield" size={16} color={colors.success} />
            </View>

            <View style={styles.termsRow}>
              <View style={styles.termItem}>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>Loan Amount</AppText>
                <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                  {formatCurrency(requestedAmount)}
                </AppText>
              </View>
              <View style={styles.termItem}>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>Interest Rate</AppText>
                <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                  {interest}% p.a.
                </AppText>
              </View>
            </View>

            <View style={[styles.termsRow, { marginTop: 16 }]}>
              <View style={styles.termItem}>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>Tenure</AppText>
                <AppText variant="bodyMedium" style={{ fontWeight: '700', color: colors.text }}>
                  {tenure} Months
                </AppText>
              </View>
              <View style={styles.termItem}>
                <AppText variant="caption" style={{ color: colors.textSecondary }}>Monthly EMI</AppText>
                <AppText variant="bodyMedium" style={{ fontWeight: '800', color: colors.primary }}>
                  {formatCurrency(emi)}
                </AppText>
              </View>
            </View>

            <AppButton
              title="Download Agreement PDF"
              variant="outline"
              size="sm"
              icon={<Feather name="download" size={16} color={colors.primary} />}
              onPress={handleDownload}
              loading={isDownloading}
              style={{ marginTop: 20 }}
            />
          </AppCard>

          {/* Legal Text Summary */}
          <AppText variant="label" style={[styles.sectionTitle, { color: colors.text }]}>
            Agreement Summary
          </AppText>
          <View style={[styles.documentBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <ScrollView nestedScrollEnabled style={styles.documentScroll}>
              <AppText variant="caption" style={{ color: colors.textSecondary, lineHeight: 18 }}>
                This Loan Agreement ("Agreement") is made between the borrower ("Borrower") and the lending institution ("Lender").{'\n\n'}
                1. DISBURSAL OF LOAN: The Lender agrees to disburse the loan amount stated above, subject to verification of details and successful bank account link setup.{'\n\n'}
                2. REPAYMENT TERMS: The Borrower agrees to repay the loan amount along with applicable interest in EMI installments on or before the due dates. Failure to do so will attract late payment fees and impact credit scores.{'\n\n'}
                3. PREPAYMENT: The Borrower may prepay the loan amount subject to foreclosure charges as detailed in the scheme guidelines.{'\n\n'}
                4. AUTHORIZATION: The Borrower authorizes the Lender to fetch credit bureau details and initiate AutoPay mandates (UPI / eNACH) for EMI recovery.
              </AppText>
            </ScrollView>
          </View>

          {/* eStamp & eSign Information Card */}
          <AppCard style={[styles.esignInfoCard, { borderColor: colors.primary + '30' }]}>
            <View style={styles.esignInfoHeader}>
              <View style={[styles.esignIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <MaterialCommunityIcons name="shield-check" size={24} color={colors.primary} />
              </View>
              <View style={styles.esignInfoTextContainer}>
                <AppText variant="labelLg" style={{ fontWeight: '700', color: colors.text }}>
                  Digital eSign & eStamp
                </AppText>
                <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                  Legally valid under IT Act, 2000
                </AppText>
              </View>
            </View>

            <View style={styles.esignFeatureList}>
              <View style={styles.esignFeatureItem}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <AppText variant="caption" style={[styles.esignFeatureText, { color: colors.text }]}>
                  Digital Stamp Duty via SHCIL (eStamp)
                </AppText>
              </View>
              <View style={styles.esignFeatureItem}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <AppText variant="caption" style={[styles.esignFeatureText, { color: colors.text }]}>
                  Aadhaar OTP-based electronic signature
                </AppText>
              </View>
              <View style={styles.esignFeatureItem}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <AppText variant="caption" style={[styles.esignFeatureText, { color: colors.text }]}>
                  Tamper-proof audit trail with timestamp & IP
                </AppText>
              </View>
              <View style={styles.esignFeatureItem}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <AppText variant="caption" style={[styles.esignFeatureText, { color: colors.text }]}>
                  Signed document available for download
                </AppText>
              </View>
            </View>
          </AppCard>

          {/* Success State */}
          {esignStatus === 'success' && (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <View style={[styles.successBanner, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
                <Feather name="check-circle" size={20} color={colors.success} />
                <AppText variant="bodyMedium" style={{ color: colors.success, fontWeight: '700', marginLeft: 8 }}>
                  Agreement signed successfully!
                </AppText>
              </View>
            </MotiView>
          )}

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
              I have read, understood and agree to all the terms, conditions, e-stamp details and policies outlined in this loan agreement. I authorize eSign via Aadhaar OTP.
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
          title={buttonConfig.title}
          variant="primary"
          size="lg"
          disabled={(!hasConsented && esignStatus !== 'failed') || buttonConfig.disabled}
          loading={isSubmitting}
          onPress={handleEsign}
          icon={
            esignStatus === 'success'
              ? <Feather name="check" size={18} color="#fff" />
              : <MaterialCommunityIcons name="shield-lock-outline" size={18} color="#fff" />
          }
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
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    paddingHorizontal: 8,
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
  // eSign Info Card
  esignInfoCard: {
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 14,
  },
  esignInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  esignIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  esignInfoTextContainer: {
    flex: 1,
  },
  esignFeatureList: {
    gap: 10,
  },
  esignFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  esignFeatureText: {
    marginLeft: 8,
    fontSize: 12.5,
    lineHeight: 16,
  },
  // Success banner
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  // Consent
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
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
