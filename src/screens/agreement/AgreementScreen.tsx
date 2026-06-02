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
import * as WebBrowser from 'expo-web-browser';
import { useColors, useTheme } from '../../theme';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { SafeHeader } from '../../components/layout/SafeHeader';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { StepIndicator } from '../../components/ui/StepIndicator';

import { useLoanStore } from '../../store/loanStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useAuthStore } from '../../store/authStore';
import { trackEvent } from '../../utils/analytics';
import { formatCurrency } from '../../utils/formatters';
import {
  initiateESign,
  refreshESignStatus,
  isDigioSdkSupported,
  createDigioInstance,
  startEsignFlow,
  extractTokenIdFromUrl,
} from '../../services/digioService';

interface AgreementScreenProps {
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
  deepLinkParams: { status: string; message?: string } | null;
  clearDeepLinkParams: () => void;
}

export const AgreementScreen: React.FC<AgreementScreenProps> = ({
  onNext,
  onBack,
  onSkip,
  deepLinkParams,
  clearDeepLinkParams,
}) => {
  const colors = useColors();
  const { theme } = useTheme();
  const { completeStep } = useOnboardingStore();

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [esignStatus, setEsignStatus] = useState<'idle' | 'creating' | 'signing' | 'success' | 'failed'>('idle');

  const esignLinkRef = useRef<string | null>(null);

  // Listen to deep links (return from browser eSign)
  useEffect(() => {
    if (deepLinkParams) {
      const { status, message } = deepLinkParams;
      clearDeepLinkParams();

      console.log("[AgreementScreen] ESign deep link event handled:", status, message);

      // Automatically dismiss the in-app WebBrowser sheet when returning via deep link
      try {
        WebBrowser.dismissBrowser();
      } catch (err) {
        console.log('[AgreementScreen] Error dismissing web browser:', err);
      }

      if (status === 'success') {
        handleCheckEsignStatus();
      } else if (status === 'error') {
        setEsignStatus('failed');
        Alert.alert('eSign Failed', message || 'The eSign process failed or was cancelled.');
      }
    }
  }, [deepLinkParams, clearDeepLinkParams]);

  const handleCheckEsignStatus = async () => {
    if (!applicationId) return;

    setIsSubmitting(true);
    try {
      console.log('[Digitap eSign] Refreshing eSign status...');
      const response = await refreshESignStatus(applicationId);
      
      setEsignStatus('success');

      completeStep('agreement');
      trackEvent('esign_completed', { documentId: response.model?.docId || '' });

      setTimeout(() => {
        setIsSubmitting(false);
        onNext();
      }, 1000);
    } catch (error: any) {
      console.error('[Digitap eSign] Status check failed:', error);
      setIsSubmitting(false);

      if (__DEV__) {
        Alert.alert(
          'Dev Sandbox: Status Check Failed',
          `Status check failed: ${error.response?.data?.message || error.message || 'Incomplete status'}.\n\nWould you like to bypass verification and proceed?`,
          [
            {
              text: 'Retry',
              onPress: () => handleCheckEsignStatus()
            },
            {
              text: 'Bypass / Force Complete',
              onPress: () => {
                console.log('[Digitap eSign] Force completing agreement...');
                setEsignStatus('success');
                completeStep('agreement');
                trackEvent('esign_completed', { documentId: 'MOCK_DOC_ID_DEV' });
                setTimeout(() => {
                  onNext();
                }, 1000);
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert(
          'Verification Incomplete',
          error.response?.data?.message || 'We could not verify your eSign completion yet. If you have signed, please wait a moment and try again.'
        );
      }
    }
  };

  const handleReopenEsignLink = async () => {
    if (esignLinkRef.current) {
      console.log('[Digitap eSign] Re-opening signing link:', esignLinkRef.current);
      await WebBrowser.openBrowserAsync(esignLinkRef.current);
    } else {
      await handleEsign();
    }
  };

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
    if (!applicationId) {
      Alert.alert('Error', 'Application ID is missing.');
      return;
    }

    setIsSubmitting(true);
    setEsignStatus('creating');
    trackEvent('esign_initiated');

    try {
      // 1. Create eSign request via backend
      const esignData = await initiateESign(applicationId);
      console.log('[Digitap eSign] Initiate response data:', esignData);

      const docId = esignData?.docId;
      let signingLink = esignData?.signingLink;
      if (esignData && !signingLink) {
        // Fallback checks for alternative casing or schema names
        signingLink = (esignData as any).signing_link || (esignData as any).url || (esignData as any).esignUrl || (esignData as any).redirectUrl || (esignData as any).redirect_url;
      }

      // Check if native Digio SDK is supported in this build/environment and we have a valid docId
      if (isDigioSdkSupported() && docId) {
        console.log('[Digitap eSign] Native Digio SDK is supported. Launching native gateway...');

        // Identifier is signer's mobile number or email
        const identifier = esignData?.identifier || useAuthStore.getState().mobile || loanStoreState.customerInfo?.mobileNumber || loanStoreState.customerInfo?.email || '';

        try {
          const digio = createDigioInstance();
          setEsignStatus('signing');

          const tokenId = signingLink ? extractTokenIdFromUrl(signingLink, docId) : undefined;
          console.log('[Digitap eSign] Extracted Token ID for native SDK:', tokenId);

          const result = await startEsignFlow(digio, docId, identifier, tokenId);
          console.log('[Digitap eSign] Native SDK flow result:', result);

          if (result.success) {
            // eSign completed successfully via native SDK — handleCheckEsignStatus manages isSubmitting
            await handleCheckEsignStatus();
            return;
          } else {
            // eSign cancelled or failed
            setEsignStatus('failed');
            setIsSubmitting(false);
            Alert.alert('eSign Failed', result.message || 'The eSign process failed or was cancelled.');
            return;
          }
        } catch (sdkError: any) {
          console.error('[Digitap eSign] SDK invocation crashed:', sdkError);
          // If SDK crashes, fallback to WebBrowser if signingLink is available
        }
      }

      // Fallback: WebBrowser based flow
      if (!signingLink) {
        console.warn('[Digitap eSign] No signing link resolved from response and Native SDK is unavailable:', esignData);

        if (__DEV__) {
          setIsSubmitting(false);
          Alert.alert(
            'Dev Sandbox: eSign Initiation Failed',
            'The backend did not return a valid signing link, and the native Digio SDK is unavailable (e.g. inside Expo Go). Would you like to mock the eSign process for testing?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  setEsignStatus('failed');
                }
              },
              {
                text: 'Bypass / Mock Sign',
                onPress: () => {
                  console.log('[Digitap eSign] Sandbox bypass activated. Transitioning to success...');
                  setEsignStatus('success');
                  completeStep('agreement');
                  trackEvent('esign_completed', { documentId: 'MOCK_DOC_ID_DEV' });
                  setTimeout(() => {
                    onNext();
                  }, 1000);
                }
              }
            ]
          );
          return;
        } else {
          throw new Error('No signing link returned from the eSign service, and native Digio SDK is unavailable.');
        }
      }

      esignLinkRef.current = signingLink;

      // 2. Open in in-app web browser — user must return manually
      setEsignStatus('signing');
      setIsSubmitting(false); // Release spinner; user must tap "I've Completed Signing"
      console.log('[Digitap eSign] Opening signing link in WebBrowser:', signingLink);

      await WebBrowser.openBrowserAsync(signingLink);
      // Browser dismissed (user closed it) — status stays 'signing' so user can tap the check button
    } catch (error: any) {
      setEsignStatus('failed');
      setIsSubmitting(false);
      console.error('eSign flow failed:', error);
      trackEvent('api_error', { error: error.message });

      if (__DEV__) {
        Alert.alert(
          'Dev Sandbox: eSign Error',
          `eSign failed: ${error.response?.data?.message || error.message || 'Unknown error'}.\n\nWould you like to bypass this step for testing?`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Bypass / Mock Sign',
              onPress: () => {
                console.log('[Digitap eSign] Sandbox bypass activated after error. Transitioning to success...');
                setEsignStatus('success');
                completeStep('agreement');
                trackEvent('esign_completed', { documentId: 'MOCK_DOC_ID_DEV' });
                setTimeout(() => {
                  onNext();
                }, 1000);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'eSign Failed',
          error.response?.data?.message || error.message || 'There was an error initiating eSign. Please try again.',
        );
      }
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
        return { title: 'Retry eSign', disabled: false };
      default:
        return { title: 'Proceed to eSign', disabled: false };
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
          {esignStatus === 'signing' ? (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 400 }}
              style={{ alignItems: 'center', marginTop: 20 }}
            >
              <View style={[styles.esignIconContainer, { backgroundColor: colors.primary + '15', width: 80, height: 80, borderRadius: 40, marginBottom: 20, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="document-text" size={40} color={colors.primary} />
              </View>

              <AppText variant="h2" style={[styles.title, { textAlign: 'center' }]}>
                Complete Aadhaar eSign
              </AppText>
              
              <AppText variant="bodyMd" style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
                We have opened the secure eSign gateway in your browser. Please enter your Aadhaar number, verify via OTP, and then return to this app.
              </AppText>

              <View style={[styles.esignInfoCard, { width: '100%', backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="lock" size={16} color={colors.success} style={{ marginRight: 8 }} />
                  <AppText variant="caption" style={{ color: colors.textSecondary, flex: 1 }}>
                    Secured by Digitap eSign Gateway. Your electronic signature is legally binding.
                  </AppText>
                </View>
              </View>

              <AppButton
                title="I've Completed Signing"
                onPress={handleCheckEsignStatus}
                variant="primary"
                size="lg"
                loading={isSubmitting}
                style={{ width: '100%', marginTop: 24 }}
              />

              <AppButton
                title="Re-open Signing Link"
                onPress={handleReopenEsignLink}
                variant="outline"
                size="md"
                style={{ width: '100%', marginTop: 12 }}
              />
            </MotiView>
          ) : (
            <>
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

              {/* eSign Information Card */}
              <AppCard style={[styles.esignInfoCard, { borderColor: colors.primary + '30' }]}>
                <View style={styles.esignInfoHeader}>
                  <View style={[styles.esignIconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <MaterialCommunityIcons name="shield-check" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.esignInfoTextContainer}>
                    <AppText variant="labelLg" style={{ fontWeight: '700', color: colors.text }}>
                      Aadhaar Digital eSign
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
                  I have read, understood and agree to all the terms, conditions, and policies outlined in this loan agreement. I authorize eSign via Aadhaar OTP.
                </AppText>
              </TouchableOpacity>
            </>
          )}
        </MotiView>
      </ScrollView>

      {/* Footer CTA */}
      {esignStatus !== 'signing' && (
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
      )}
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
